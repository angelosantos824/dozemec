const pool = require("../config/database");

async function getMap(tenantId) {
  const [areas] = await pool.execute(
    "SELECT id, name, code, display_order AS displayOrder FROM workshop_areas WHERE tenant_id = ? AND deleted_at IS NULL AND status = 'active' ORDER BY display_order, name",
    [tenantId]
  );
  const [bays] = await pool.execute(
    `SELECT id, area_id AS areaId, name, code, bay_type AS bayType, operational_status AS operationalStatus, color, display_order AS displayOrder
    FROM workshop_bays WHERE tenant_id = ? AND deleted_at IS NULL AND status = 'active' ORDER BY display_order, name`,
    [tenantId]
  );
  const [equipment] = await pool.execute(
    "SELECT id, bay_id AS bayId, name, operational_status AS operationalStatus FROM workshop_equipment WHERE tenant_id = ? AND deleted_at IS NULL AND status = 'active'",
    [tenantId]
  );

  const equipmentByBay = new Map();
  for (const item of equipment) {
    if (!equipmentByBay.has(item.bayId)) equipmentByBay.set(item.bayId, []);
    equipmentByBay.get(item.bayId).push(item);
  }

  const baysByArea = new Map();
  for (const bay of bays) {
    bay.equipment = equipmentByBay.get(bay.id) || [];
    if (!baysByArea.has(bay.areaId)) baysByArea.set(bay.areaId, []);
    baysByArea.get(bay.areaId).push(bay);
  }

  const counts = {
    totalBays: bays.length,
    availableBays: bays.filter((bay) => bay.operationalStatus === "available").length,
    reservedBays: bays.filter((bay) => bay.operationalStatus === "reserved").length,
    occupiedBays: bays.filter((bay) => bay.operationalStatus === "occupied").length,
    maintenanceBays: bays.filter((bay) => bay.operationalStatus === "maintenance").length,
    unavailableBays: bays.filter((bay) => bay.operationalStatus === "unavailable").length,
    totalEquipment: equipment.length,
    equipmentInMaintenance: equipment.filter((item) => item.operationalStatus === "maintenance").length
  };

  return {
    areas: areas.map((area) => ({ ...area, bays: baysByArea.get(area.id) || [] })),
    summary: counts
  };
}

module.exports = { getMap };
