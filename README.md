# virtual-labs-water

Water Engineering Virtual Laboratory for MCP KNUST: a static, multi-page lab manual with ten
practical sessions. Each session pairs the bench method with an interactive apparatus, a live
calculation panel, an observation sheet and review questions.

No build step, no framework, no dependencies. Open `index.html` or serve the directory.

## Sessions

| # | Session | Focus |
|---|---------|-------|
| 01 | Turbidity & Apparent Colour | Nephelometry, dilution correction, absorbance to Pt-Co |
| 02 | pH, Acidity & Alkalinity | Two-endpoint titration, carbonate speciation |
| 03 | Total Hardness by EDTA | Complexometric titration, Ca/Mg split |
| 04 | Jar Test | Alum dose optimisation, pH dependence, sludge estimate |
| 05 | Sedimentation: Type I | Stokes to Schiller-Naumann, overflow rate, removal |
| 06 | Rapid Sand Filtration | Carman-Kozeny head loss, filter run, breakthrough |
| 07 | Breakpoint Chlorination | Chlorine demand, breakpoint, Ct and log inactivation |
| 08 | Dissolved Oxygen & BOD5 | Winkler method, seeded dilution, Streeter-Phelps sag |
| 09 | Chemical Oxygen Demand | Dichromate reflux, FAS titration, BOD/COD ratio |
| 10 | Head Loss in Pipes | Darcy-Weisbach, Colebrook-White, minor losses, power |

## Run it

```bash
# simplest: open the file
xdg-open index.html

# or serve it (recommended, keeps relative paths clean)
python3 -m http.server 8000
```

Then visit http://localhost:8000.

To publish on GitHub Pages: Settings -> Pages -> Deploy from a branch -> `main` / root. The site is
entirely static, so no workflow file is needed.

## Structure

```
index.html                     lab home: session index, limits, usage notes
sessions/session-NN-*.html     one page per session
assets/css/lab.css             single stylesheet (print styles included)
assets/js/lab.js               shared chrome, navigation, progress, tables, reports, charts
assets/js/sim/sNN-*.js         one simulation engine per session
```

## How the simulations work

Every number in a session comes from an explicit model, not a scripted animation. The pages state
the equations they use, and each simulation engine implements them directly:

- **01** dilution correction `NTU = reading x DF`; Beer-Lambert for colour.
- **02** closed carbonate system solved by bisection on the charge balance, with
  `Alk = CT(a1 + 2a2) + Kw/H - H`. Endpoint volumes come from the same model, and the species are
  resolved from the measured P and T, not from the inputs.
- **03** EDTA 1:1 stoichiometry, `hardness = V*M*100000/V_sample`; calcium at pH 12.5 by difference.
- **04** U-shaped dose-response with a pH efficiency window and a settling factor; the reported
  optimum is the jar with the lowest residual.
- **05** terminal velocity solved iteratively with the Schiller-Naumann drag correlation, so the
  result stays valid outside the Stokes range; removal = `min(1, v_s/v_0)`.
- **06** Carman-Kozeny clean-bed head loss, linear deposit growth, and a breakthrough time that sets
  the run end alongside the terminal head.
- **07** 7.6:1 breakpoint stoichiometry, combined-residual peak at 5:1, `Ct` against
  temperature-corrected 3-log Giardia values.
- **08** Winkler stoichiometry, seeded-blank BOD with validity checks, BOD kinetics and the
  Streeter-Phelps sag with its critical point.
- **09** `COD = (V_blank - V_sample)*N*8000/V_sample`, with the BOD/COD ratio as the biodegradability
  index. The result is withheld until the end point is reached.
- **10** Darcy-Weisbach with the friction factor from Colebrook-White (fixed-point iteration) and
  64/Re in the laminar range.

## Features

- Session navigation with per-browser progress tracking (localStorage).
- Observation sheets that accept recorded readings and export to CSV.
- Session report export as Markdown, including the computed values and the observation sheet.
- Review questions with hidden worked answers.
- Print styles: simulations are removed and answers expanded, so the browser print dialog produces a
  clean lab report.
- Responsive down to phone width; no external requests, so it works offline.

## Featured: World Water Day 2026 interactive lab

`sessions/World_Water_Day_2026_Interactive_Laboratory.html` is a self-contained, projection-format
event lab for World Water Day 2026 (Clean Rivers, Sustainable Livelihoods). Ten stations, one
experiment per screen, each with a live canvas, controls and worked output:

| Station | Topic |
|---|---|
| 01 | Vectors + matrix |
| 02 | Electron configuration |
| 03 | Chemical bonding |
| 04 | Bits |
| 05 | Qubit |
| 06 | Quantum gates |
| 07 | Superposition |
| 08 | Entanglement |
| 09 | Pollutant capture (MOF) |
| 10 | VQE energy |

It opens on a cover slide; press Enter to begin. Styles, scripts and artwork are embedded, so it works
offline and from any path. It is linked from the lab home and from the "World Water Day" entry in the
sidebar of every session page.

## Standards used for verdicts

Ghana Standards Authority GS 175-1 and the WHO Guidelines for Drinking-water Quality (4th edition):
turbidity 5 NTU, colour 15 TCU, pH 6.5-8.5, hardness 500 mg/L as CaCO3, free chlorine 0.2-1.0 mg/L,
BOD5 50 mg/L and COD 250 mg/L for discharge, velocity 0.6-1.5 m/s in distribution mains.

## Scope

Teaching simulations calibrated to APHA Standard Methods. They are not a substitute for accredited
laboratory analysis, and simulated readings are not field data.
