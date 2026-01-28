enum VMUserPermissions {
  owner = 100,
  operator = 50,
  viewer = 10,
}

type PermissionName = keyof typeof VMUserPermissions;

export function parsePermissionVMUser(input: string): VMUserPermissions {
  const key = input.trim().toLowerCase() as PermissionName;
  return VMUserPermissions[key] || VMUserPermissions.viewer;
}

export default VMUserPermissions;
