# @axismojo/icons

## 1.4.0

### Minor Changes

- 75f60a8: Add `ByAxisMojo` and `AxisMojoMark`: the one "by Axis Mojo" for every Axis Mojo app, built to axis-mojo/docs/BYLINE.md. One baseline row 1.5em tall, "by" in Anek Latin 500, the shaded 3D lattu in a box 0.1489em short so the words stand on its tip, the name in Space Grotesk 700. Attributes: `size` (`sm` 11 px, `md` 13 px, `lg` 15 px), `theme` (`auto` follows the page, `light`, `dark`, `band`) and `animated` (the lattu spins like a top). It carries its own animation CSS; apps load the two fonts and never copy or restyle it.
- 01c997c: Add `DoorEnter`: an arrow going into sesameru's door, drawn like the logo: a door outline, the door filled with the accent colour (the door light) and its knob. It is the one icon whose accent is a shape, not a dot, and the style check lists it as such.

## 1.3.0

### Minor Changes

- 059a64d: Seven new icons for Datumber's console, drawn on the family's own shapes: DatabasePlus, DatabaseBackup and Migration (the Database cylinder, opened where the plus, the restore arrow or the up arrow sits, as MapPinPlus is), TableRowPlus (Table2 with a plus in its body, as CalendarPlus), ServerPlus (as ServerCog, with a plus), Ground (cricket stumps and bails, with the ball as the accent) and Gate (a double gate under an arch).

## 1.2.0

### Minor Changes

- 4feaade: Add 17 icons for photo Catches: ShoppingBag, Utensils, Market (an open stall under a striped awning), FerrisWheel,
  Baby, Family, PawPrint, Images, ImagePlus and SwitchCamera; and for who a place suits and what is good to know there:
  PersonStanding, Couple, Child (with a balloon), Parking, Accessible, Restroom and Indoors.

## 1.1.0

### Minor Changes

- 7175729: 34 new icons for Tatrajam: the jamun and its ripening (`Jamun`, `FruitBud`, `FruitRipening`, `FruitRipe`, `FruitFallen`, `Crown`), the tree (`Twig`, `Sapling`, `Tree`, `Roots`), radar-first discovery (`Radar`, `Locate`, `Navigation`, `Happening`, `MapPinCheck`, `MapPinPlus`, `MapPinOff`, `MapPinArea`), Catch (`Catch`, `Viewfinder`, `Loop`, `Corner`, `Crowd`, `Footprints`), Reach (`Store`, `RadioTower`, `Audience`, `Boost`, `ScanQrCode`, `Ticket`, `Stamp`) and rewards (`Points`, `Gift`, `RewardLock`). New aliases: `TreeDeciduous`, `LocateFixed`, `Storefront`, `CheckIn`, `Broadcast`, `Footfall`, `Throw`.

## 1.0.2

### Patch Changes

- d4f5712: Relative imports now end in `.js`, so the package loads in Node (tests, SSR) as well as in bundlers.

## 1.0.1

### Patch Changes

- b9cebb4: Published without a provenance statement (the source repository is private), and the codemod's `bin` path written as npm expects.
