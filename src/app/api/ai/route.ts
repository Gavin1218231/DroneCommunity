import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';

const DRONE_KNOWLEDGE = {
  regulations: {
    part107: 'FAA Part 107 is the certification required for commercial drone operations in the US. Key rules: max altitude 400ft AGL, visual line of sight required, no flights over people without waiver (or Category 1-4 compliance), daylight operations (or with anti-collision lighting), max speed 100mph, must yield to manned aircraft.',
    registration: 'All drones weighing between 0.55 lbs (250g) and 55 lbs must be registered with the FAA. Registration costs $5 and is valid for 3 years. You must display your registration number on the drone.',
    remote_id: 'Remote ID is required for all drones as of March 2024. Drones must broadcast identification and location information. You can use Standard Remote ID (built-in), Remote ID broadcast module, or fly at FRIA (FAA-Recognized Identification Areas).',
    airspace: 'Controlled airspace (Class B, C, D, E) requires LAANC authorization or a manual airspace authorization. Use apps like Aloft (formerly Kittyhawk), AirMap, or DJI Fly to check airspace and get LAANC approval.',
  },
  cameras: {
    settings: 'For aerial photography: shoot in RAW for maximum editing flexibility. Use ND filters to maintain cinematic shutter speeds (double your frame rate). For video, use 24fps for cinematic, 30fps for standard, 60fps for slow motion. Use D-Log or HLG profiles for maximum dynamic range.',
    tips: 'Golden hour (sunrise/sunset) provides the best lighting. Shoot in manual exposure mode. Use histogram to check exposure. Bracket exposures for HDR. For real estate, shoot during blue hour for dramatic interior/exterior contrast.',
  },
  drones: {
    beginner: 'Best beginner drones: DJI Mini 4 Pro (sub-250g, no registration needed in many countries), DJI Air 3 (great all-rounder), Autel EVO Nano+ (compact alternative). All offer obstacle avoidance and intelligent flight modes.',
    professional: 'Professional options: DJI Mavic 3 Pro (triple camera system), DJI Inspire 3 (cinema-grade), Autel EVO II Pro (6K camera), DJI Matrice series (enterprise/mapping). For FPV: DJI Avata 2 (beginner FPV), custom 5" builds (advanced freestyle/racing).',
    maintenance: 'Regular maintenance: check props for damage before each flight, keep firmware updated, calibrate compass when prompted, store batteries at 40-60% for long-term storage, clean camera lens/sensors, check for loose connections.',
  },
  flight_planning: {
    preflight: 'Pre-flight checklist: check weather (wind, visibility, precipitation), verify airspace authorization, inspect drone and batteries, plan flight path, identify emergency landing zones, check for NOTAMs, brief any visual observers.',
    weather: 'Safe flying conditions: wind under 20mph (check at altitude), visibility over 3 miles, no precipitation, temperature between 32-104°F for most drones. Use UAV Forecast or Windy apps for detailed drone-specific weather.',
    battery: 'Battery tips: land with at least 20% remaining, dont fly in extreme temperatures, warm batteries to room temp before cold weather flights, use battery warmers in winter, cycle batteries every 20 charges.',
  },
};

function generateAIResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('part 107') || lower.includes('commercial') || lower.includes('certification') || lower.includes('license')) {
    return `Great question about drone certification!\n\n${DRONE_KNOWLEDGE.regulations.part107}\n\nThe Part 107 test covers:\n- Airspace classification and operating requirements\n- Weather theory and effects on drone operations\n- Drone loading and performance\n- Emergency procedures\n- Crew resource management\n- Radio communication procedures\n\nI recommend studying with resources like the FAA's free Pilot Handbook of Aeronautical Knowledge and practice tests from sites like 3DR or Pilot Institute. The recurrent training (renewal every 24 months) is now done online through the FAA Safety Team (FAASTeam) website.`;
  }

  if (lower.includes('register') || lower.includes('registration') || lower.includes('faa')) {
    return `Here's what you need to know about drone registration:\n\n${DRONE_KNOWLEDGE.regulations.registration}\n\n${DRONE_KNOWLEDGE.regulations.remote_id}\n\nYou can register at faadronezone.faa.gov. The process is quick and straightforward!`;
  }

  if (lower.includes('airspace') || lower.includes('laanc') || lower.includes('where can i fly') || lower.includes('no fly')) {
    return `Understanding airspace is crucial for safe and legal drone operations!\n\n${DRONE_KNOWLEDGE.regulations.airspace}\n\nKey airspace classes:\n- **Class G** (uncontrolled): Generally free to fly up to 400ft AGL\n- **Class E**: May need authorization depending on surface designation\n- **Class D**: Requires LAANC or manual authorization\n- **Class C**: Requires LAANC or manual authorization\n- **Class B**: Requires LAANC or manual authorization (strictest)\n\nAlways check B4UFLY or similar apps before every flight!`;
  }

  if (lower.includes('camera') || lower.includes('photo') || lower.includes('video') || lower.includes('settings') || lower.includes('shoot')) {
    return `Here are my top camera and shooting tips:\n\n${DRONE_KNOWLEDGE.cameras.settings}\n\n**Pro Tips:**\n${DRONE_KNOWLEDGE.cameras.tips}\n\n**Recommended Settings for Cinematic Video:**\n- Resolution: 4K or higher\n- Frame rate: 24fps (cinematic) or 30fps (standard)\n- Shutter speed: 1/48 for 24fps, 1/60 for 30fps\n- ND filter: Adjust to achieve correct shutter speed\n- Color profile: D-Log M or HLG\n- White balance: Manual (match conditions)\n\nPost-processing with DaVinci Resolve (free) or Adobe Premiere will really make your footage shine!`;
  }

  if (lower.includes('beginner') || lower.includes('first drone') || lower.includes('recommend') || lower.includes('which drone') || lower.includes('buy')) {
    return `Here are my drone recommendations:\n\n**For Beginners:**\n${DRONE_KNOWLEDGE.drones.beginner}\n\n**For Professionals:**\n${DRONE_KNOWLEDGE.drones.professional}\n\nWhen choosing a drone, consider:\n1. **Budget**: Entry-level ($300-500), Mid-range ($700-1500), Professional ($2000+)\n2. **Use case**: Photography, videography, FPV, mapping, inspection\n3. **Size/portability**: Sub-250g (fewer regulations), compact foldable, full-size\n4. **Camera quality**: 1/1.3" sensor minimum for serious photo/video\n5. **Flight time**: 30-45 minutes typical, longer with enterprise drones\n\nMy top pick for most people: **DJI Air 3** — great balance of features, camera quality, and portability!`;
  }

  if (lower.includes('maintenance') || lower.includes('care') || lower.includes('repair') || lower.includes('prop') || lower.includes('battery')) {
    return `Proper drone maintenance is essential for safe operations!\n\n${DRONE_KNOWLEDGE.drones.maintenance}\n\n**Battery Care:**\n${DRONE_KNOWLEDGE.flight_planning.battery}\n\n**Additional Tips:**\n- Keep a flight log to track total flight time and battery cycles\n- Replace props every 200 flights or immediately if damaged\n- Use a landing pad to prevent debris damage\n- Store your drone in a protective case\n- Calibrate IMU and compass periodically\n- Keep firmware up to date for safety and performance improvements`;
  }

  if (lower.includes('weather') || lower.includes('wind') || lower.includes('rain') || lower.includes('cold') || lower.includes('hot')) {
    return `Weather is one of the most important factors for safe drone operations!\n\n${DRONE_KNOWLEDGE.flight_planning.weather}\n\n**Recommended Weather Apps for Drone Pilots:**\n- **UAV Forecast**: Purpose-built for drone operations\n- **Windy**: Excellent wind visualization at different altitudes\n- **ADSB Exchange**: See manned aircraft traffic\n- **B4UFLY**: FAA official airspace app\n\n**Wind Guidelines by Drone Size:**\n- Sub-250g drones: Max 15-20mph winds\n- Mid-size (Mavic/Air): Max 20-25mph winds\n- Enterprise drones: Max 25-30mph winds\n\nAlways check wind at your planned altitude, not just ground level!`;
  }

  if (lower.includes('preflight') || lower.includes('checklist') || lower.includes('before') || lower.includes('planning') || lower.includes('prepare')) {
    return `Here's a comprehensive pre-flight checklist:\n\n${DRONE_KNOWLEDGE.flight_planning.preflight}\n\n**Detailed Checklist:**\n\n1. **Airspace & Legal**\n   - Check airspace authorization (LAANC)\n   - Verify any NOTAMs or TFRs\n   - Confirm registration/Remote ID\n\n2. **Weather**\n   - Wind speed and direction\n   - Cloud ceiling and visibility\n   - Precipitation forecast\n\n3. **Equipment**\n   - Battery charged (100%)\n   - Props inspected and secure\n   - Camera lens clean\n   - SD card formatted and inserted\n   - Controller charged\n   - Firmware up to date\n\n4. **Site Survey**\n   - Identify obstacles (trees, wires, buildings)\n   - Plan takeoff/landing area\n   - Note emergency landing options\n   - Brief any observers or crew\n\n5. **Flight**\n   - Hover test at 10ft before full flight\n   - Monitor battery throughout\n   - Maintain VLOS at all times`;
  }

  if (lower.includes('fpv') || lower.includes('racing') || lower.includes('freestyle') || lower.includes('acro')) {
    return `FPV (First Person View) flying is one of the most exciting aspects of the drone hobby!\n\n**Getting Started with FPV:**\n1. **Simulator first**: Use Liftoff, Velocidrone, or Uncrashed to learn without crashing\n2. **Beginner FPV drones**: DJI Avata 2 (easy entry), BetaFPV Cetus X (tiny whoop)\n3. **Controllers**: DJI RC Motion (simple), RadioMaster Boxer/TX16S (versatile), DJI RC 2\n\n**Building Custom FPV Quads:**\n- Frame: 5" for freestyle, 3" for cinematic micro\n- Flight Controller: F7 or H7 processor\n- ESC: 45A+ BLHeli_32 or AM32\n- Motors: 2306 or 2207 for 5"\n- Props: HQProp, Gemfan, or Ethix\n- VTX: DJI O3 Air Unit or HDZero for digital\n\n**Betaflight Tips:**\n- Start with defaults in Betaflight 4.5\n- Use RPM filtering for clean tune\n- Set rates low at first, increase as you improve\n- Join a local MultiGP chapter for racing events!\n\nPractice, practice, practice — FPV has a learning curve but it is incredibly rewarding!`;
  }

  // Default helpful response
  return `That's a great topic! Here's what I can help you with:\n\n**Drone Knowledge Areas:**\n- **Regulations**: Part 107, registration, Remote ID, airspace\n- **Camera/Photography**: Settings, tips, color profiles, filters\n- **Drone Recommendations**: Beginners, professionals, FPV\n- **Flight Planning**: Pre-flight checks, weather, safety\n- **Maintenance**: Battery care, prop inspection, storage\n- **FPV Flying**: Racing, freestyle, building custom quads\n\nTry asking me something specific like:\n- "What do I need for Part 107?"\n- "What camera settings should I use?"\n- "Which drone should I buy as a beginner?"\n- "What's a good pre-flight checklist?"\n- "How do I get started with FPV?"\n- "Can I fly in controlled airspace?"\n\nI'm here to help with anything drone-related! What would you like to know more about?`;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = generateAIResponse(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
