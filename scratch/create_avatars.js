const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'avatars');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const avatars = [
  {
    filename: 'mc-snapback.svg',
    name: 'MC Legend',
    category: 'hiphop',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-mc" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#2a2e39"/>
          <stop offset="100%" stop-color="#0e1014"/>
        </radialGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFE600"/>
          <stop offset="100%" stop-color="#FF9900"/>
        </linearGradient>
        <linearGradient id="acid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#D4FF00"/>
          <stop offset="100%" stop-color="#99CC00"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-mc)" stroke="#C6FF00" stroke-width="3"/>
      <!-- Cap Backwards -->
      <path d="M30 45 C30 25 90 25 90 45 Z" fill="#FF0055"/>
      <rect x="25" y="42" width="70" height="8" rx="3" fill="#C6FF00"/>
      <path d="M85 45 L108 52 L95 56 Z" fill="#CC0044"/>
      <!-- Face -->
      <rect x="36" y="48" width="48" height="42" rx="14" fill="#E0A97B"/>
      <!-- Shades -->
      <path d="M38 56 H58 V68 H38 Z M62 56 H82 V68 H62 Z" fill="#111" stroke="#FF0055" stroke-width="2"/>
      <path d="M42 58 L54 66" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <path d="M66 58 L78 66" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <rect x="56" y="60" width="8" height="3" fill="#111"/>
      <!-- Beard & Mouth -->
      <path d="M52 78 Q60 84 68 78" stroke="#111" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M46 76 C46 88 74 88 74 76" fill="#2B1D15"/>
      <!-- Gold Chain -->
      <path d="M40 92 Q60 112 80 92" stroke="url(#gold)" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="60" cy="103" r="6" fill="url(#gold)" stroke="#fff" stroke-width="1"/>
      <!-- Mic -->
      <rect x="76" y="70" width="8" height="18" rx="3" fill="#555" transform="rotate(-25 76 70)"/>
      <circle cx="86" cy="68" r="7" fill="url(#acid)" stroke="#111" stroke-width="1.5"/>
    </svg>`
  },
  {
    filename: 'dj-scratch.svg',
    name: 'DJ Scratch',
    category: 'hiphop',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-dj" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#252a36"/>
          <stop offset="100%" stop-color="#0a0c10"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-dj)" stroke="#00E5FF" stroke-width="3"/>
      <!-- Headphones band -->
      <path d="M22 55 C22 20 98 20 98 55" fill="none" stroke="#00E5FF" stroke-width="6" stroke-linecap="round"/>
      <!-- Face / Head -->
      <circle cx="60" cy="58" r="28" fill="#F0C29E"/>
      <!-- Sunglasses -->
      <rect x="40" y="50" width="40" height="15" rx="4" fill="#111" stroke="#C6FF00" stroke-width="2"/>
      <line x1="43" y1="54" x2="55" y2="62" stroke="#00E5FF" stroke-width="2"/>
      <line x1="65" y1="54" x2="77" y2="62" stroke="#00E5FF" stroke-width="2"/>
      <!-- Big Earcups -->
      <rect x="16" y="44" width="16" height="28" rx="8" fill="#FF0055" stroke="#fff" stroke-width="1.5"/>
      <rect x="88" y="44" width="16" height="28" rx="8" fill="#FF0055" stroke="#fff" stroke-width="1.5"/>
      <!-- Vinyl record bottom -->
      <circle cx="60" cy="100" r="30" fill="#151515" stroke="#333" stroke-width="2"/>
      <circle cx="60" cy="100" r="22" fill="none" stroke="#252525" stroke-width="1.5"/>
      <circle cx="60" cy="100" r="14" fill="none" stroke="#2a2a2a" stroke-width="1.5"/>
      <circle cx="60" cy="100" r="8" fill="#00E5FF"/>
      <circle cx="60" cy="100" r="2" fill="#fff"/>
    </svg>`
  },
  {
    filename: 'graffiti-respirator.svg',
    name: 'Graffiti Writer',
    category: 'graffiti',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-gr" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#351a30"/>
          <stop offset="100%" stop-color="#0d0810"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-gr)" stroke="#FF0055" stroke-width="3"/>
      <!-- Hoodie -->
      <path d="M25 90 C25 40 95 40 95 90 Z" fill="#222" stroke="#FF0055" stroke-width="2"/>
      <path d="M34 85 C34 50 86 50 86 85 Z" fill="#151515"/>
      <!-- Eyes angry -->
      <path d="M42 54 L54 58 L44 61 Z" fill="#C6FF00"/>
      <path d="M78 54 L66 58 L76 61 Z" fill="#C6FF00"/>
      <!-- 3M Mask -->
      <path d="M44 68 L76 68 L68 94 L52 94 Z" fill="#444" stroke="#111" stroke-width="2"/>
      <!-- Filter cartridges -->
      <circle cx="38" cy="80" r="12" fill="#FF0055" stroke="#111" stroke-width="2"/>
      <circle cx="38" cy="80" r="7" fill="#C6FF00"/>
      <circle cx="82" cy="80" r="12" fill="#FF0055" stroke="#111" stroke-width="2"/>
      <circle cx="82" cy="80" r="7" fill="#C6FF00"/>
      <!-- Paint Splatters -->
      <circle cx="28" cy="35" r="4" fill="#C6FF00"/>
      <path d="M28 39 Q29 48 27 52" stroke="#C6FF00" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="92" cy="32" r="5" fill="#00E5FF"/>
      <circle cx="86" cy="22" r="3" fill="#FF0055"/>
    </svg>`
  },
  {
    filename: 'street-doberman.svg',
    name: 'Doberman Street',
    category: 'animals',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-dob" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#30281e"/>
          <stop offset="100%" stop-color="#0f0c08"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-dob)" stroke="#FFB300" stroke-width="3"/>
      <!-- Ears pointed -->
      <polygon points="34,18 48,46 26,48" fill="#1C1814" stroke="#FFB300" stroke-width="1.5"/>
      <polygon points="86,18 72,46 94,48" fill="#1C1814" stroke="#FFB300" stroke-width="1.5"/>
      <polygon points="36,24 45,44 30,45" fill="#99582A"/>
      <polygon points="84,24 75,44 90,45" fill="#99582A"/>
      <!-- Head -->
      <path d="M38 42 L82 42 L76 88 L60 98 L44 88 Z" fill="#1C1814"/>
      <!-- Tan muzzle -->
      <path d="M48 68 L72 68 L68 94 L60 98 L52 94 Z" fill="#99582A"/>
      <!-- Nose -->
      <polygon points="54,82 66,82 60,89" fill="#0A0806"/>
      <!-- Gold Aviator Shades -->
      <path d="M40 50 H58 V64 H40 Z M62 50 H80 V64 H62 Z" fill="#0A0806" stroke="#FFE600" stroke-width="2"/>
      <line x1="58" y1="54" x2="62" y2="54" stroke="#FFE600" stroke-width="2"/>
      <line x1="43" y1="52" x2="52" y2="62" stroke="#FFE600" stroke-width="1.5" opacity="0.6"/>
      <line x1="65" y1="52" x2="74" y2="62" stroke="#FFE600" stroke-width="1.5" opacity="0.6"/>
      <!-- Spiked Collar -->
      <path d="M36 94 Q60 106 84 94 L86 102 Q60 114 34 102 Z" fill="#C6FF00"/>
      <polygon points="46,98 48,93 50,98" fill="#fff"/>
      <polygon points="58,102 60,97 62,102" fill="#fff"/>
      <polygon points="70,98 72,93 74,98" fill="#fff"/>
    </svg>`
  },
  {
    filename: 'street-cat.svg',
    name: 'Gato Callejero',
    category: 'animals',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-cat" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1f2c38"/>
          <stop offset="100%" stop-color="#0a1017"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-cat)" stroke="#00E5FF" stroke-width="3"/>
      <!-- Ears -->
      <polygon points="28,26 44,48 24,52" fill="#2B3238" stroke="#00E5FF" stroke-width="1.5"/>
      <polygon points="92,26 76,48 96,52" fill="#2B3238" stroke="#00E5FF" stroke-width="1.5"/>
      <!-- Beanie Hat pulled down -->
      <path d="M30 42 C30 22 90 22 90 42 Z" fill="#FFB300"/>
      <rect x="26" y="38" width="68" height="10" rx="4" fill="#C6FF00"/>
      <!-- Face -->
      <circle cx="60" cy="65" r="28" fill="#2B3238"/>
      <!-- Whiskers -->
      <line x1="32" y1="72" x2="16" y2="70" stroke="#00E5FF" stroke-width="2"/>
      <line x1="32" y1="76" x2="18" y2="78" stroke="#00E5FF" stroke-width="2"/>
      <line x1="88" y1="72" x2="104" y2="70" stroke="#00E5FF" stroke-width="2"/>
      <line x1="88" y1="76" x2="102" y2="78" stroke="#00E5FF" stroke-width="2"/>
      <!-- Sunglasses with neon reflection -->
      <ellipse cx="48" cy="62" rx="10" ry="8" fill="#111" stroke="#00E5FF" stroke-width="2"/>
      <ellipse cx="72" cy="62" rx="10" ry="8" fill="#111" stroke="#00E5FF" stroke-width="2"/>
      <line x1="58" y1="62" x2="62" y2="62" stroke="#00E5FF" stroke-width="2"/>
      <!-- Nose & Mouth -->
      <polygon points="57,74 63,74 60,78" fill="#FF6699"/>
      <path d="M54 81 Q60 85 66 81" stroke="#fff" stroke-width="2" fill="none"/>
      <!-- Chain -->
      <path d="M42 94 Q60 110 78 94" stroke="#FFE600" stroke-width="4" fill="none"/>
    </svg>`
  },
  {
    filename: 'boombox-classic.svg',
    name: 'Boombox 80s',
    category: 'hiphop',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-box" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#2a2533"/>
          <stop offset="100%" stop-color="#0e0a14"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-box)" stroke="#C6FF00" stroke-width="3"/>
      <!-- Handle -->
      <rect x="42" y="24" width="36" height="12" rx="3" fill="none" stroke="#C6FF00" stroke-width="4"/>
      <!-- Main Boombox body -->
      <rect x="20" y="36" width="80" height="56" rx="8" fill="#1C1E24" stroke="#fff" stroke-width="2"/>
      <!-- Speakers Left & Right -->
      <circle cx="38" cy="66" r="16" fill="#111" stroke="#C6FF00" stroke-width="2"/>
      <circle cx="38" cy="66" r="8" fill="#FF0055"/>
      <circle cx="38" cy="66" r="3" fill="#fff"/>
      <circle cx="82" cy="66" r="16" fill="#111" stroke="#00E5FF" stroke-width="2"/>
      <circle cx="82" cy="66" r="8" fill="#FF0055"/>
      <circle cx="82" cy="66" r="3" fill="#fff"/>
      <!-- Cassette Door center -->
      <rect x="56" y="56" width="8" height="20" rx="2" fill="#2A2D36" stroke="#FFE600" stroke-width="1.5"/>
      <!-- EQ Bars top -->
      <rect x="28" y="42" width="64" height="6" rx="2" fill="#111"/>
      <rect x="30" y="44" width="8" height="2" fill="#00E5FF"/>
      <rect x="42" y="44" width="12" height="2" fill="#C6FF00"/>
      <rect x="58" y="44" width="10" height="2" fill="#FFB300"/>
      <rect x="72" y="44" width="14" height="2" fill="#FF0055"/>
    </svg>`
  },
  {
    filename: 'spray-can.svg',
    name: 'Lata de Spray',
    category: 'graffiti',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-sp" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#36222b"/>
          <stop offset="100%" stop-color="#12060b"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-sp)" stroke="#FF0055" stroke-width="3"/>
      <!-- Spray mist effect -->
      <path d="M72 26 L106 14 L98 38 Z" fill="#C6FF00" opacity="0.8"/>
      <!-- Cap / Nozzle Fat Cap -->
      <rect x="52" y="24" width="16" height="12" rx="3" fill="#fff" stroke="#111" stroke-width="2"/>
      <rect x="62" y="27" width="5" height="4" fill="#111"/>
      <!-- Dome top -->
      <path d="M40 42 C40 34 80 34 80 42 Z" fill="#C6FF00" stroke="#111" stroke-width="2"/>
      <!-- Can Body -->
      <rect x="40" y="42" width="40" height="62" rx="6" fill="#FF0055" stroke="#111" stroke-width="2"/>
      <!-- Drips -->
      <path d="M40 54 Q46 64 50 54 Q56 68 62 54 Q68 62 74 54 L80 54 L80 42 L40 42 Z" fill="#C6FF00"/>
      <!-- Crown on Can -->
      <polygon points="50,78 54,70 60,75 66,70 70,78" fill="#FFE600" stroke="#111" stroke-width="1.5"/>
      <rect x="50" y="78" width="20" height="3" fill="#FFE600" stroke="#111" stroke-width="1"/>
      <circle cx="50" cy="88" r="2" fill="#fff"/>
      <circle cx="70" cy="88" r="2" fill="#fff"/>
    </svg>`
  },
  {
    filename: 'skull-hiphop.svg',
    name: 'Calavera Cypher',
    category: 'furia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-sk" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#2b2d38"/>
          <stop offset="100%" stop-color="#0a0a10"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-sk)" stroke="#C6FF00" stroke-width="3"/>
      <!-- Bandana -->
      <path d="M30 42 Q60 30 90 42 L94 56 Q60 46 26 56 Z" fill="#FF0055"/>
      <circle cx="42" cy="48" r="1.5" fill="#fff"/>
      <circle cx="60" cy="44" r="1.5" fill="#fff"/>
      <circle cx="78" cy="48" r="1.5" fill="#fff"/>
      <!-- Skull Cranium -->
      <path d="M34 54 C34 40 86 40 86 54 C86 68 82 74 74 76 L74 88 L46 88 L46 76 C38 74 34 68 34 54 Z" fill="#E8ECEF" stroke="#111" stroke-width="2"/>
      <!-- Eye Sockets with glowing pupils -->
      <ellipse cx="48" cy="62" rx="7" ry="8" fill="#111"/>
      <circle cx="48" cy="62" r="3" fill="#C6FF00"/>
      <ellipse cx="72" cy="62" rx="7" ry="8" fill="#111"/>
      <circle cx="72" cy="62" r="3" fill="#C6FF00"/>
      <!-- Nose Cavity -->
      <polygon points="57,72 63,72 60,77" fill="#111"/>
      <!-- Teeth -->
      <rect x="50" y="80" width="4" height="6" rx="1" fill="#fff" stroke="#111"/>
      <rect x="55" y="80" width="4" height="6" rx="1" fill="#FFE600" stroke="#111"/>
      <rect x="61" y="80" width="4" height="6" rx="1" fill="#fff" stroke="#111"/>
      <rect x="66" y="80" width="4" height="6" rx="1" fill="#fff" stroke="#111"/>
      <!-- Crossbones hint behind -->
      <circle cx="60" cy="102" r="6" fill="#C6FF00"/>
    </svg>`
  },
  {
    filename: 'lion-flow.svg',
    name: 'León Urbano',
    category: 'animals',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-ln" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#3b2b1a"/>
          <stop offset="100%" stop-color="#120c05"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-ln)" stroke="#FFE600" stroke-width="3"/>
      <!-- Wild Mane like flames -->
      <path d="M60 16 L68 30 L82 20 L84 36 L100 32 L94 48 L106 56 L96 66 L104 80 L88 84 L90 98 L74 94 L68 106 L60 96 L52 106 L46 94 L30 98 L32 84 L16 80 L24 66 L14 56 L26 48 L20 32 L36 36 L38 20 L52 30 Z" fill="#FF8800" stroke="#FFE600" stroke-width="2"/>
      <!-- Face -->
      <ellipse cx="60" cy="62" rx="26" ry="24" fill="#F0B429"/>
      <!-- Muzzle -->
      <ellipse cx="60" cy="74" rx="14" ry="10" fill="#FFF4D4"/>
      <polygon points="56,70 64,70 60,75" fill="#111"/>
      <line x1="60" y1="75" x2="60" y2="80" stroke="#111" stroke-width="2"/>
      <!-- Sunglasses with acid glow -->
      <rect x="40" y="52" width="18" height="14" rx="4" fill="#111" stroke="#C6FF00" stroke-width="2"/>
      <rect x="62" y="52" width="18" height="14" rx="4" fill="#111" stroke="#C6FF00" stroke-width="2"/>
      <line x1="58" y1="56" x2="62" y2="56" stroke="#C6FF00" stroke-width="2"/>
      <!-- Crown -->
      <polygon points="46,30 52,20 60,26 68,20 74,30" fill="#FFE600" stroke="#fff" stroke-width="1.5"/>
    </svg>`
  },
  {
    filename: 'tiger-stripes.svg',
    name: 'Tigre Neón',
    category: 'animals',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-tg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#3d2112"/>
          <stop offset="100%" stop-color="#120803"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-tg)" stroke="#FF6600" stroke-width="3"/>
      <!-- Ears -->
      <circle cx="34" cy="36" r="14" fill="#FF6600" stroke="#111" stroke-width="2"/>
      <circle cx="34" cy="36" r="7" fill="#111"/>
      <circle cx="86" cy="36" r="14" fill="#FF6600" stroke="#111" stroke-width="2"/>
      <circle cx="86" cy="36" r="7" fill="#111"/>
      <!-- Head -->
      <circle cx="60" cy="64" r="30" fill="#FF6600" stroke="#111" stroke-width="2"/>
      <!-- White cheeks -->
      <ellipse cx="46" cy="74" rx="10" ry="8" fill="#FFF"/>
      <ellipse cx="74" cy="74" rx="10" ry="8" fill="#FFF"/>
      <!-- Black Stripes -->
      <polygon points="60,36 56,46 64,46" fill="#111"/>
      <polygon points="42,48 48,52 42,56" fill="#111"/>
      <polygon points="78,48 72,52 78,56" fill="#111"/>
      <polygon points="34,62 42,64 36,68" fill="#111"/>
      <polygon points="86,62 78,64 84,68" fill="#111"/>
      <!-- Neon Acid Eyes -->
      <ellipse cx="48" cy="60" rx="6" ry="7" fill="#C6FF00" stroke="#111" stroke-width="1.5"/>
      <ellipse cx="48" cy="60" rx="2" ry="6" fill="#111"/>
      <ellipse cx="72" cy="60" rx="6" ry="7" fill="#C6FF00" stroke="#111" stroke-width="1.5"/>
      <ellipse cx="72" cy="60" rx="2" ry="6" fill="#111"/>
      <!-- Nose & Mouth -->
      <polygon points="56,70 64,70 60,76" fill="#FF0055"/>
      <path d="M52 82 Q60 88 68 82" stroke="#111" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    filename: 'wolf-moon.svg',
    name: 'Lobo Solitario',
    category: 'animals',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-wf" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1c2538"/>
          <stop offset="100%" stop-color="#080c14"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-wf)" stroke="#00E5FF" stroke-width="3"/>
      <!-- Crescent moon backdrop -->
      <path d="M85 24 C65 24 55 45 60 70 C75 65 92 50 85 24 Z" fill="#00E5FF" opacity="0.3"/>
      <!-- Ears pointed -->
      <polygon points="30,22 46,46 24,50" fill="#4B5563" stroke="#00E5FF" stroke-width="1.5"/>
      <polygon points="90,22 74,46 96,50" fill="#4B5563" stroke="#00E5FF" stroke-width="1.5"/>
      <!-- Face -->
      <polygon points="36,46 84,46 76,82 60,96 44,82" fill="#374151" stroke="#111" stroke-width="2"/>
      <!-- Snout -->
      <polygon points="50,68 70,68 60,94" fill="#1F2937"/>
      <ellipse cx="60" cy="88" rx="6" ry="4" fill="#111"/>
      <!-- Glowing cyan eyes -->
      <polygon points="42,54 54,58 44,62" fill="#00E5FF"/>
      <polygon points="78,54 66,58 76,62" fill="#00E5FF"/>
      <!-- Microphone in teeth -->
      <rect x="42" y="86" width="36" height="5" rx="2" fill="#888" stroke="#111" stroke-width="1"/>
      <circle cx="78" cy="88" r="6" fill="#C6FF00" stroke="#111" stroke-width="1"/>
    </svg>`
  },
  {
    filename: 'cassette-mixtape.svg',
    name: 'Mixtape 90s',
    category: 'hiphop',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-cas" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#302636"/>
          <stop offset="100%" stop-color="#0e0a12"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-cas)" stroke="#FF0055" stroke-width="3"/>
      <!-- Cassette Body -->
      <rect x="22" y="36" width="76" height="48" rx="6" fill="#181920" stroke="#C6FF00" stroke-width="2"/>
      <!-- Label sticker -->
      <rect x="28" y="42" width="64" height="28" rx="3" fill="#FFE600"/>
      <text x="60" y="52" font-family="sans-serif" font-weight="900" font-size="7" text-anchor="middle" fill="#111">LARVAZ VOL. 1</text>
      <!-- Center Spools window -->
      <rect x="36" y="56" width="48" height="16" rx="3" fill="#111"/>
      <circle cx="46" cy="64" r="6" fill="#fff"/>
      <circle cx="46" cy="64" r="3" fill="#111"/>
      <circle cx="74" cy="64" r="6" fill="#fff"/>
      <circle cx="74" cy="64" r="3" fill="#111"/>
      <!-- Tape loop -->
      <line x1="52" y1="64" x2="68" y2="64" stroke="#4A3B32" stroke-width="3"/>
      <!-- Screws -->
      <circle cx="26" cy="40" r="1.5" fill="#666"/>
      <circle cx="94" cy="40" r="1.5" fill="#666"/>
      <circle cx="26" cy="80" r="1.5" fill="#666"/>
      <circle cx="94" cy="80" r="1.5" fill="#666"/>
    </svg>`
  },
  {
    filename: 'fuego-cypher.svg',
    name: 'Fuego Bars',
    category: 'furia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-fg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#401810"/>
          <stop offset="100%" stop-color="#140603"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-fg)" stroke="#FF3300" stroke-width="3"/>
      <!-- Main Flame -->
      <path d="M60 16 C60 16 75 32 75 48 C75 52 82 46 84 42 C88 56 86 72 78 82 C84 80 88 74 88 68 C92 84 78 100 60 100 C42 100 28 84 32 68 C32 74 36 80 42 82 C34 72 32 56 36 42 C38 46 45 52 45 48 C45 32 60 16 60 16 Z" fill="#FF4400" stroke="#FFE600" stroke-width="2"/>
      <!-- Inner core yellow flame -->
      <path d="M60 44 C60 44 70 56 70 68 C70 76 65 84 60 88 C55 84 50 76 50 68 C50 56 60 44 60 44 Z" fill="#FFE600"/>
      <!-- Sunglasses on flame -->
      <rect x="42" y="58" width="16" height="10" rx="3" fill="#111" stroke="#fff" stroke-width="1.5"/>
      <rect x="62" y="58" width="16" height="10" rx="3" fill="#111" stroke="#fff" stroke-width="1.5"/>
      <line x1="58" y1="62" x2="62" y2="62" stroke="#fff" stroke-width="1.5"/>
      <path d="M52 76 Q60 82 68 76" stroke="#111" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    filename: 'bboy-cap.svg',
    name: 'B-Boy Vortex',
    category: 'hiphop',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-bb" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#22333b"/>
          <stop offset="100%" stop-color="#080e12"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-bb)" stroke="#00E5FF" stroke-width="3"/>
      <!-- Sideways Snapback Cap -->
      <path d="M34 46 C34 26 86 26 86 46 Z" fill="#00E5FF"/>
      <path d="M30 46 L95 44 L110 38 L95 48 Z" fill="#C6FF00"/>
      <circle cx="60" cy="26" r="3" fill="#111"/>
      <!-- Face -->
      <rect x="38" y="48" width="44" height="42" rx="12" fill="#DDB892"/>
      <!-- Bandana around neck/chin -->
      <polygon points="40,76 80,76 60,98" fill="#FF0055" stroke="#111" stroke-width="1.5"/>
      <circle cx="60" cy="86" r="2" fill="#fff"/>
      <!-- Sports sunglasses -->
      <path d="M40 54 H58 V66 H40 Z M62 54 H80 V66 H62 Z" fill="#111" stroke="#C6FF00" stroke-width="2"/>
      <line x1="58" y1="58" x2="62" y2="58" stroke="#C6FF00" stroke-width="2"/>
      <path d="M42 56 L52 64" stroke="#00E5FF" stroke-width="1.5"/>
      <path d="M64 56 L74 64" stroke="#00E5FF" stroke-width="1.5"/>
    </svg>`
  },
  {
    filename: 'dragon-graffiti.svg',
    name: 'Dragón Street',
    category: 'furia',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-dr" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#1a3b2b"/>
          <stop offset="100%" stop-color="#041209"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-dr)" stroke="#00FF88" stroke-width="3"/>
      <!-- Horns -->
      <path d="M38 36 C34 20 20 18 18 20 C22 28 32 36 38 42 Z" fill="#FFE600" stroke="#111" stroke-width="1.5"/>
      <path d="M82 36 C86 20 100 18 102 20 C98 28 88 36 82 42 Z" fill="#FFE600" stroke="#111" stroke-width="1.5"/>
      <!-- Head shape -->
      <polygon points="34,44 86,44 78,82 60,96 42,82" fill="#00B368" stroke="#111" stroke-width="2"/>
      <polygon points="46,54 74,54 68,90 60,94 52,90" fill="#00FF88"/>
      <!-- Angry Red Eyes -->
      <polygon points="42,54 54,58 44,64" fill="#FF0055"/>
      <polygon points="78,54 66,58 76,64" fill="#FF0055"/>
      <circle cx="48" cy="58" r="2" fill="#fff"/>
      <circle cx="72" cy="58" r="2" fill="#fff"/>
      <!-- Smoke from nostrils -->
      <circle cx="54" cy="80" r="2" fill="#111"/>
      <circle cx="66" cy="80" r="2" fill="#111"/>
      <path d="M50 82 Q38 88 34 82" stroke="#00FF88" stroke-width="2" fill="none" opacity="0.8"/>
      <path d="M70 82 Q82 88 86 82" stroke="#00FF88" stroke-width="2" fill="none" opacity="0.8"/>
    </svg>`
  },
  {
    filename: 'vinilo-oro.svg',
    name: 'Disco de Platino',
    category: 'hiphop',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id="bg-vn" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#3b3520"/>
          <stop offset="100%" stop-color="#120f04"/>
        </radialGradient>
        <linearGradient id="gold-disk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF275"/>
          <stop offset="50%" stop-color="#FFB300"/>
          <stop offset="100%" stop-color="#FF8000"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#bg-vn)" stroke="#FFE600" stroke-width="3"/>
      <!-- Gold Vinyl -->
      <circle cx="60" cy="60" r="44" fill="#1A1A1A" stroke="url(#gold-disk)" stroke-width="4"/>
      <circle cx="60" cy="60" r="36" fill="none" stroke="#333" stroke-width="1.5"/>
      <circle cx="60" cy="60" r="28" fill="none" stroke="#252525" stroke-width="1.5"/>
      <circle cx="60" cy="60" r="20" fill="none" stroke="#333" stroke-width="1.5"/>
      <!-- Center Label -->
      <circle cx="60" cy="60" r="15" fill="url(#gold-disk)"/>
      <circle cx="60" cy="60" r="4" fill="#111"/>
      <path d="M60 20 L66 32 L78 30 L70 40 L76 52 L64 46 L60 60 Z" fill="#fff" opacity="0.15"/>
      <!-- Crown on top -->
      <polygon points="48,22 53,14 60,19 67,14 72,22" fill="#FFE600" stroke="#111" stroke-width="1"/>
    </svg>`
  }
];

avatars.forEach(av => {
  const filePath = path.join(dir, av.filename);
  fs.writeFileSync(filePath, av.svg.trim(), 'utf8');
});

console.log(`Generated ${avatars.length} SVG sticker avatars in public/avatars/`);
