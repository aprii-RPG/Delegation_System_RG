import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Supabase Edge Function environment is incomplete.');
    return Response.json({ error: 'Server configuration error.' }, { status: 500, headers: corsHeaders });
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return Response.json({ error: 'Sign in as an administrator first.' }, { status: 401, headers: corsHeaders });
  }

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) {
    return Response.json({ error: 'Your session is invalid or expired.' }, { status: 401, headers: corsHeaders });
  }

  const { data: isAdmin, error: roleError } = await caller.rpc('is_delegateos_admin');
  if (roleError) {
    console.error('Admin role check failed:', roleError.message);
    return Response.json({ error: 'Unable to verify administrator permission.' }, { status: 500, headers: corsHeaders });
  }
  if (!isAdmin) {
    return Response.json({ error: 'Only an administrator can invite employees.' }, { status: 403, headers: corsHeaders });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400, headers: corsHeaders });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const roleTitle = typeof body.roleTitle === 'string' ? body.roleTitle.trim() : 'Team Specialist';
  const department = typeof body.department === 'string' ? body.department.trim() : 'Operations';
  const avatar = typeof body.avatar === 'string' ? body.avatar : '';
  const accentColor = typeof body.accentColor === 'string' ? body.accentColor : '#3b82f6';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName) {
    return Response.json({ error: 'A valid email and employee name are required.' }, { status: 400, headers: corsHeaders });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (body.action === 'delete') {
    const employeeId = typeof body.employeeId === 'string' ? body.employeeId : '';
    if (!employeeId) {
      return Response.json({ error: 'Employee ID is required.' }, { status: 400, headers: corsHeaders });
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, app_role')
      .eq('employee_id', employeeId)
      .maybeSingle();
    if (profileError) {
      console.error('Employee lookup failed:', profileError.message);
      return Response.json({ error: 'Unable to find employee.' }, { status: 500, headers: corsHeaders });
    }
    if (!profile || profile.app_role === 'admin') {
      return Response.json({ error: 'This employee cannot be removed.' }, { status: 404, headers: corsHeaders });
    }

    const { data: assignedTask, error: taskError } = await admin
      .from('tasks')
      .select('id')
      .contains('assignee_employee_ids', [employeeId])
      .limit(1)
      .maybeSingle();
    if (taskError) {
      console.error('Employee task check failed:', taskError.message);
      return Response.json({ error: 'Unable to verify employee task assignments.' }, { status: 500, headers: corsHeaders });
    }
    if (assignedTask) {
      return Response.json(
        { error: 'Reassign this employee’s tasks before removing their account.' },
        { status: 409, headers: corsHeaders },
      );
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(profile.id);
    if (deleteError) {
      console.error('Employee removal failed:', deleteError.message);
      return Response.json({ error: 'Unable to remove employee account.' }, { status: 500, headers: corsHeaders });
    }
    return Response.json({ employeeId }, { headers: corsHeaders });
  }

  if (body.action !== undefined && body.action !== 'invite') {
    return Response.json({ error: 'Unsupported action.' }, { status: 400, headers: corsHeaders });
  }

  const employeeId = `doer-${crypto.randomUUID()}`;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      employee_id: employeeId,
      full_name: fullName,
      role_title: roleTitle,
      department,
      avatar,
      accent_color: accentColor,
    },
  });

  if (error) {
    console.error('Employee invitation failed:', error.message);
    return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
  }

  return Response.json(
    { employeeId, userId: data.user.id, invitedEmail: data.user.email },
    { status: 201, headers: corsHeaders },
  );
});
