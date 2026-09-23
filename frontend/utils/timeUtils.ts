export interface WebinarSlotsInfo {
  dayOfWeek: string;
  slots: string[];
  fullFormatted: {
    slot: string;
    label: string;
  }[];
}

export function getDynamicWebinarSlots(): WebinarSlotsInfo {
  const now = new Date();
  
  const daysMap = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  
  const dayName = daysMap[now.getDay()];
  
  // Slot 1: 20 minutes from access time, rounded up to next 5 minutes
  const slot1Date = new Date(now.getTime() + 20 * 60 * 1000);
  const minutes = slot1Date.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 5) * 5;
  if (roundedMinutes === 60) {
    slot1Date.setHours(slot1Date.getHours() + 1);
    slot1Date.setMinutes(0);
  } else {
    slot1Date.setMinutes(roundedMinutes);
  }
  
  // Slot 2: +1 hour from Slot 1
  const slot2Date = new Date(slot1Date.getTime() + 60 * 60 * 1000);
  // Slot 3: +2 hours from Slot 1
  const slot3Date = new Date(slot1Date.getTime() + 120 * 60 * 1000);
  
  const formatTime = (d: Date) => {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };
  
  const s1 = formatTime(slot1Date);
  const s2 = formatTime(slot2Date);
  const s3 = formatTime(slot3Date);
  
  return {
    dayOfWeek: dayName,
    slots: [s1, s2, s3],
    fullFormatted: [
      { slot: s1, label: `Às ${s1} (Brasília)` },
      { slot: s2, label: `Às ${s2} (Brasília)` },
      { slot: s3, label: `Às ${s3} (Brasília)` }
    ]
  };
}
