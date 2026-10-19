export function validateCatalog(data) {
  const fail = () => {
    throw new Error('Invalid catalog contract');
  };
  if (
    !data ||
    !data.version ||
    !data.updated_at ||
    !data.pricing ||
    !Array.isArray(data.categories) ||
    !Array.isArray(data.services)
  )
    fail();
  if (
    !['month', 'year', 'trial_days'].every(
      (k) => Number.isInteger(data.pricing[k]) && data.pricing[k] > 0,
    )
  )
    fail();
  const categories = new Set(data.categories.map((c) => c.id));
  if (data.categories.some((c) => !c.id || !c.name)) fail();
  const ids = new Set();
  for (const s of data.services) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id) ||
      ids.has(s.id) ||
      !s.name ||
      !categories.has(s.category) ||
      !['available', 'soon'].includes(s.status) ||
      !Array.isArray(s.segments) ||
      !s.segments.every((x) => ['seller', 'smb', 'personal'].includes(x)) ||
      !Array.isArray(s.examples) ||
      s.examples.length < 1 ||
      !['short', 'auth_label', 'read_only_note', 'instruction_slug', 'icon_url'].every(
        (k) => typeof s[k] === 'string',
      ) ||
      !Number.isInteger(s.votes) ||
      s.votes < 0
    )
      fail();
    if (s.icon_url && !s.icon_url.startsWith('/') && !s.icon_url.startsWith('https://')) fail();
    ids.add(s.id);
  }
  return true;
}
