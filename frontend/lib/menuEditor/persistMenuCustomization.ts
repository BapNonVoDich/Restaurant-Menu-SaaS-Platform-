/**
 * Lưu patch vào store.menuData.customization (backend MenuService merge vào GET menu).
 */

export async function fetchStoredMenuDataObject(
  apiUrl: string,
  storeId: string,
  token: string
): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-data`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return {}
  const data = (await res.json()) as { menuData?: unknown }
  const md = data.menuData
  if (md && typeof md === 'object' && !Array.isArray(md)) {
    return { ...(md as Record<string, unknown>) }
  }
  return {}
}

export async function persistCustomizationPatch(
  apiUrl: string,
  storeId: string,
  token: string,
  patch: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const prev = await fetchStoredMenuDataObject(apiUrl, storeId, token)
  const prevCustomRaw = prev.customization
  const prevCustom =
    prevCustomRaw && typeof prevCustomRaw === 'object' && !Array.isArray(prevCustomRaw)
      ? { ...(prevCustomRaw as Record<string, unknown>) }
      : {}

  const res = await fetch(`${apiUrl}/catalog/stores/${storeId}/menu-data`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      menuData: {
        ...prev,
        customization: { ...prevCustom, ...patch },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { ok: false, error: (err as { error?: string }).error || 'Không lưu được' }
  }
  return { ok: true }
}
