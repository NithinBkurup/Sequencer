export const state = {
  left: [],           // sequencing – unscheduled
  right: [],          // sequencing / resequence – scheduled
  materialGroups: []  // resequence material view
};

// Get last scheduled time for a specific line from database
export async function getLastScheduledTime(plant) {
  try {
    const response = await fetch(`/api/last-scheduled?plant=${plant}`);
    if (response.ok) {
      const data = await response.json();
      return data.lastScheduledTime ? new Date(data.lastScheduledTime) : null;
    }
  } catch (e) {
    console.error('Error fetching last scheduled time:', e);
  }
  return null;
}

// Sequencing: calculate schedule starting from last order or now
export async function recalcSchedule(plant, taktSeconds = 240) {
  let startTime = await getLastScheduledTime(plant);
  
  if (!startTime) {
    // If no previous orders, start from now
    startTime = new Date();
  } else {
    // Start from last scheduled time + takt
    startTime = new Date(startTime);
    startTime.setSeconds(startTime.getSeconds() + taktSeconds);
  }

  // Reset milliseconds to zero for clean timestamps
  startTime.setMilliseconds(0);

  let t = new Date(startTime);

  state.right.forEach(o => {
    // Create clean date with milliseconds set to zero
    const scheduledTime = new Date(t);
    scheduledTime.setMilliseconds(0);
    o.ScheduledTime = scheduledTime;
    
    // Increment time for next order
    t = new Date(t.getTime() + (taktSeconds * 1000));
  });
}

// ✅ FIXED: Resequence material grouping based on CONSECUTIVE sequences
export function buildMaterialGroups() {
  state.materialGroups = [];

  if (state.right.length === 0) {
    return;
  }

  let currentGroup = null;

  state.right.forEach((order, index) => {
    // Start new group if:
    // 1. First order, OR
    // 2. Different material than current group
    if (!currentGroup || currentGroup.MaterialCode !== order.MaterialCode) {
      // Save previous group if exists
      if (currentGroup) {
        state.materialGroups.push(currentGroup);
      }

      // Start new group
      currentGroup = {
        MaterialCode: order.MaterialCode,
        MaterialDesc: order.MaterialDesc,
        Count: 1,
        Orders: [order],
        ScheduledTime: order.ScheduledTime,
        GroupIndex: state.materialGroups.length // For debugging
      };
    } else {
      // Same material as current group - add to it
      currentGroup.Count++;
      currentGroup.Orders.push(order);
    }
  });

  // Don't forget to add the last group
  if (currentGroup) {
    state.materialGroups.push(currentGroup);
  }

  console.log(`Built ${state.materialGroups.length} material groups:`,
    state.materialGroups.map(g => `${g.MaterialCode} (${g.Count})`).join(', '));
}