# 🎨 PROFESSIONAL MEDIA ASSETS GUIDE
## PUNCH⏰CLOCK Malaysia - Design System v2.2

This guide defines the visual language, asset requirements, and generation prompts to maintain a world-class **Neo-Brutalist Enterprise** aesthetic for PUNCHCLOCK.

---

## 1. Design System Analysis

### Aesthetic: "Tactile Authority"
PunchClock uses a **Neo-Brutalist** style. Unlike "Soft UI" or "Minimalist" trends, this system uses visual weight to imply reliability and urgency.

*   **Borders:** Strict `2px` to `4px` solid borders (Black in light mode, White/Gray-800 in dark mode).
*   **Shadows:** Zero blur, hard offset shadows. `shadow-[6px_6px_0_0_#000]`.
*   **Palette:**
    *   `Core Dark`: `#050505` (Background), `#121212` (Cards)
    *   `Electric Blue`: `#3B82F6` (Primary Action / IT)
    *   `Heritage Gold`: `#FFD700` (Urgency / Admin)
    *   `Success Green`: `#10B981` (Payroll / Verified)
    *   `Warning Red`: `#EF4444` (Risks / Disciplinary)
*   **Typography:**
    *   *Headings*: **Space Grotesk** (Black weight, tracking-tighter).
    *   *Body*: **Inter** (Medium/Bold weight, high readability).

---

## 2. Required Media Assets

### A. Employee Avatars (Malaysian Diversity)
**Requirement:** 12x high-res 1:1 photos representing the multicultural Malaysian workforce.
**Dimensions:** 512x512px | **Format:** WebP (optimized)

| Asset Name | Persona | Mood |
| :--- | :--- | :--- |
| `avatar-ali.webp` | Malay, Male, Late 20s | Tech Professional, friendly |
| `avatar-meilin.webp` | Chinese, Female, 30s | Corporate Executive, sharp |
| `avatar-muthu.webp` | Indian, Male, 40s | Senior Manager, authoritative |
| `avatar-sarah.webp` | Malay, Female (Tudung), 20s | Operations Lead, energetic |
| `avatar-raj.webp` | Indian, Male, 25 | Intern, bright |
| `avatar-chong.webp` | Chinese, Male, 50s | CEO/Director, seasoned |

### B. Module Scene Illustrations
**Requirement:** Hero imagery for empty states and module introductions.
**Dimensions:** 1200x800px | **Style:** 3D Isometric + Neo-Brutalist Wireframes.

1.  **Attendance Hub**: A biometric kiosk glowing in a dark corridor with KLCC skyline in the background.
2.  **Payroll Engine**: Stacks of Ringgit (RM) notes arranged in a geometric, Bauhaus-style composition.
3.  **Compliance Audit**: A digital magnifying glass scanning a stack of high-contrast "Employment Act" papers.
4.  **Shift Planner**: A complex grid of glowing neon blocks representing workforce coverage.

### C. Icon Set (Neo-Custom)
**Requirement:** Custom icons with thick strokes and high-contrast fill.

**Prompts for 512x512 Bitmap Variants:**
*   **App Icon**: `App icon for a modern HR software called PUNCHCLOCK. A square yellow block with a heavy black outline, containing a white clock face and a bold blue checkmark. Neo-Brutalist style, high contrast, flat colors, no gradients. --v 6.0`
*   **Attendance**: `A face scan identity frame icon. Neon blue glowing lines on a white background, thick black borders, brutalist perspective. --v 6.0`
*   **Payroll**: `A neon green coin icon with a bold black 'RM' currency symbol. 3D isometric brutalist style, sharp edges, hard shadow. --v 6.0`
*   **Compliance**: `A thick-bordered red shield icon with a white checkmark in the center. Modern minimalist brutalism, high impact. --v 6.0`

---

## 3. Implementation Specs (Cloudinary/CSS)

### Cloudinary Upload Presets
*   **Transformation:** `c_fill,g_face,w_512,h_512,q_auto,f_webp`
*   **Naming Convention:** `pc_assets/v2/module_[name]_[state]`

### CSS Component Mapping
```css
/* The Signature PunchClock Card */
.neo-card {
  @apply bg-white dark:bg-[#121212] border-4 border-black dark:border-white 
         shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.1)]
         transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none;
}

/* Biometric Scanner Pulse */
.scanner-glow {
  filter: drop-shadow(0 0 15px #3B82F6);
  animation: pulse 1.5s infinite ease-in-out;
}
```

---

## 4. Generation Prompts

### Midjourney v6 Prompt (Employee Avatars)
> `[Persona Description], professional corporate headshot, studio lighting, soft rim light, looking at camera, solid deep gray background, high resolution, 8k, sharp focus, wearing modern business casual attire, representative of Malaysian [Ethnic Group] --ar 1:1 --v 6.0`

### DALL-E 3 Prompt (Scene Illustrations)
> `Professional 3D isometric illustration for an HR software. The scene shows [Module Description]. Use a Neo-Brutalist style: high contrast, thick black outlines, limited color palette of Electric Blue, Gold, and Charcoal. Incorporate subtle Malaysian corporate elements. Minimalist, clean, enterprise tech aesthetic.`

### Figma Component Spec
*   **Corner Radius:** `1.5rem` (Large), `0.75rem` (Medium).
*   **Border Width:** `2pt` inside.
*   **Shadows:** Effect: Drop Shadow | X: 6, Y: 6, Blur: 0, Spread: 0 | Color: #000000.

---

## 5. Accessibility & Compliance
*   **Alt Text:** Every image must have descriptive `alt` tags (e.g., "Ali, Senior Developer, Profile Photo").
*   **Contrast:** Minimum 4.5:1 ratio for all text-on-image overlays.
*   **Data Sovereignty:** Ensure all employee imagery is generated via AI or uses properly licensed stock with specific "Release of Rights" for Malaysian usage.
