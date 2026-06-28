#!/usr/bin/env node
/*
 * build-tags.js
 * -------------
 * Classifies castings by make / region / model from their name, for the
 * tag-based casting search (clickable make + model + region tags).
 *
 * v1 — produces a review artifact only (does NOT touch the DB):
 *   scripts/output/casting-tags.json   { lnk, name, make, region, model, themes }
 *   + prints coverage + per-make / per-region counts + a sample of unmatched.
 *
 * Iterate on the dictionary below, re-run, review, then we bake tags into the
 * data and wire the filter.
 *
 * Usage: node scripts/build-tags.js
 */

const fs = require('fs');
const path = require('path');

const DB = path.join('data', 'carsdata.json');
const OUT = path.join('scripts', 'output', 'casting-tags.json');

// make -> region + aliases (names as written) + models. `infer` models imply the
// make even with no make in the name ("Custom Camaro" -> Chevrolet); ambiguous
// models (GT, SS) are only used as a model tag when the make is already known.
const MAKES = [
  { make: 'Ford', region: 'American', aliases: ['Ford'], infer: ['Mustang', 'Thunderbird', 'T-Bird', 'Falcon', 'Torino', 'Fairlane', 'Galaxie', 'Pinto', 'Maverick', 'Bronco', 'Ranchero'], models: ['Mustang', 'GT40', 'GT', 'F-150', 'F-100', 'Bronco', 'Falcon', 'Torino', 'Fairlane', 'Galaxie', 'Thunderbird', 'T-Bird', 'Escort', 'Focus', 'Capri', 'Pinto', 'Maverick', 'Ranger', 'Shelby', 'RS200', 'Sierra', 'Cortina', 'Probe', 'Fusion', 'Raptor', 'Ranchero', 'Model A', 'Model T', 'Deuce'] },
  { make: 'Chevrolet', region: 'American', aliases: ['Chevy', 'Chevrolet'], infer: ['Camaro', 'Corvette', 'Chevelle', 'Nova', 'Impala', 'Bel Air', 'Nomad', 'El Camino', 'Stingray', 'Monte Carlo'], models: ['Camaro', 'Corvette', 'Chevelle', 'Nova', 'Impala', 'Bel Air', 'Nomad', 'Silverado', 'Monte Carlo', 'Stingray', 'Blazer', 'Suburban', 'El Camino', 'S-10', 'C10', 'Vega', 'Malibu', 'Cruze', 'Camaro SS'] },
  { make: 'Dodge', region: 'American', aliases: ['Dodge'], infer: ['Charger', 'Challenger', 'Viper', 'Dart', 'Super Bee', 'Daytona', 'Coronet'], models: ['Charger', 'Challenger', 'Viper', 'Dart', 'Super Bee', 'Daytona', 'Coronet', 'Ram', 'Demon', 'Magnum', 'Polara'] },
  { make: 'Plymouth', region: 'American', aliases: ['Plymouth'], infer: ['Barracuda', 'Cuda', 'Road Runner', 'Roadrunner', 'Superbird', 'GTX', 'Duster'], models: ['Barracuda', 'Cuda', 'Road Runner', 'Roadrunner', 'Superbird', 'GTX', 'Duster', 'Fury', 'Belvedere'] },
  { make: 'Pontiac', region: 'American', aliases: ['Pontiac'], infer: ['Firebird', 'GTO', 'Trans Am', 'Bonneville'], models: ['Firebird', 'GTO', 'Trans Am', 'Bonneville', 'Grand Prix', 'Grand Am', 'Fiero', 'Catalina'] },
  { make: 'Buick', region: 'American', aliases: ['Buick'], infer: ['Grand National', 'Riviera'], models: ['Grand National', 'Riviera', 'Skylark', 'GSX', 'Regal'] },
  { make: 'Cadillac', region: 'American', aliases: ['Cadillac'], infer: ['Eldorado', 'Escalade'], models: ['Eldorado', 'Escalade', 'CTS', 'Coupe DeVille', 'DeVille', 'Seville'] },
  { make: 'Chrysler', region: 'American', aliases: ['Chrysler'], infer: ['300'], models: ['300', '300C', 'PT Cruiser'] },
  { make: 'Mercury', region: 'American', aliases: ['Mercury', 'Merc'], infer: ['Cougar', 'Comet'], models: ['Cougar', 'Comet', 'Marauder', 'Cyclone', 'Monterey'] },
  { make: 'Oldsmobile', region: 'American', aliases: ['Oldsmobile', 'Olds'], infer: ['442', 'Cutlass'], models: ['442', 'Cutlass', 'Toronado'] },
  { make: 'Jeep', region: 'American', aliases: ['Jeep'], infer: ['Wrangler', 'Cherokee'], models: ['Wrangler', 'Cherokee', 'Gladiator', 'CJ-7', 'Grand Cherokee'] },
  { make: 'Shelby', region: 'American', aliases: ['Shelby'], infer: ['Cobra', 'GT350', 'GT500', 'Daytona Coupe'], models: ['Cobra', 'GT350', 'GT350R', 'GT500', 'Daytona Coupe', 'Series 1'] },
  { make: 'AMC', region: 'American', aliases: ['AMC', 'American Motors'], infer: ['AMX', 'Javelin', 'Gremlin', 'Pacer', 'Rebel Machine'], models: ['AMX', 'Javelin', 'Gremlin', 'Pacer', 'Rebel', 'Rebel Machine', 'Hornet', 'Matador'] },
  { make: 'Tesla', region: 'American', aliases: ['Tesla'], infer: [], models: ['Model S', 'Model 3', 'Cybertruck', 'Roadster'] },
  { make: 'Hummer', region: 'American', aliases: ['Hummer'], infer: [], models: ['H1', 'H2', 'H3'] },

  { make: 'Nissan', region: 'Japanese', aliases: ['Nissan'], infer: ['Skyline', 'Silvia', 'Fairlady', 'GT-R', '240SX', '350Z', '370Z'], models: ['Skyline', 'GT-R', 'Silvia', '240SX', '350Z', '370Z', 'Fairlady', 'Z', 'Maxima', 'Sentra', 'Titan', 'Leaf', '240Z', '280Z'] },
  { make: 'Datsun', region: 'Japanese', aliases: ['Datsun'], infer: ['510', '240Z', '620'], models: ['510', '240Z', '620', 'Bluebird'] },
  { make: 'Toyota', region: 'Japanese', aliases: ['Toyota'], infer: ['Supra', 'Celica', 'AE86', 'Corolla', 'Land Cruiser', 'Tacoma'], models: ['Supra', 'Celica', 'AE86', 'Corolla', 'Land Cruiser', 'Tacoma', 'Tundra', '2000GT', '4Runner', 'MR2', 'Prius', 'GR86', 'Trueno', 'Hilux'] },
  { make: 'Honda', region: 'Japanese', aliases: ['Honda', 'Acura'], infer: ['Civic', 'Integra', 'NSX', 'S2000', 'Prelude'], models: ['Civic', 'Integra', 'NSX', 'S2000', 'Prelude', 'CR-X', 'CRX', 'Accord', 'Type R'] },
  { make: 'Mazda', region: 'Japanese', aliases: ['Mazda'], infer: ['RX-7', 'RX-8', 'Miata', 'MX-5'], models: ['RX-7', 'RX-8', 'Miata', 'MX-5', 'RX-3', 'Cosmo', '787B', 'Familia'] },
  { make: 'Mitsubishi', region: 'Japanese', aliases: ['Mitsubishi'], infer: ['Lancer', 'Eclipse', 'Pajero'], models: ['Lancer', 'Lancer Evolution', 'Eclipse', 'Pajero', '3000GT', 'Montero'] },
  { make: 'Subaru', region: 'Japanese', aliases: ['Subaru'], infer: ['Impreza', 'WRX', 'BRZ'], models: ['Impreza', 'WRX', 'BRZ', 'Legacy', 'SVX'] },
  { make: 'Lexus', region: 'Japanese', aliases: ['Lexus'], infer: ['LFA', 'IS', 'RC'], models: ['LFA', 'IS', 'RC', 'LC', 'GS'] },
  { make: 'Suzuki', region: 'Japanese', aliases: ['Suzuki'], infer: ['Jimny'], models: ['Jimny', 'Cappuccino', 'Swift'] },

  { make: 'Porsche', region: 'European', aliases: ['Porsche'], infer: ['911', '356', '959', 'Carrera', 'Cayman', 'Boxster', 'Panamera', 'Taycan'], models: ['911', '356', '959', '930', '914', 'Carrera', 'Cayman', 'Boxster', 'Panamera', 'Taycan', '918', 'Cayenne', 'GT3', 'RWB'] },
  { make: 'Ferrari', region: 'European', aliases: ['Ferrari'], infer: ['Testarossa', 'Enzo', 'LaFerrari', 'Dino', '458', '488', 'F40', 'F50'], models: ['Testarossa', 'Enzo', 'LaFerrari', 'Dino', '458', '488', 'F40', 'F50', '308', '512', '250', '599', '360', 'California', 'Daytona', '812', 'SF90'] },
  { make: 'Lamborghini', region: 'European', aliases: ['Lamborghini', 'Lambo'], infer: ['Countach', 'Diablo', 'Murcielago', 'Gallardo', 'Aventador', 'Huracan', 'Miura'], models: ['Countach', 'Diablo', 'Murcielago', 'Gallardo', 'Aventador', 'Huracan', 'Miura', 'Urus', 'Sesto Elemento', 'Reventon'] },
  { make: 'BMW', region: 'European', aliases: ['BMW'], infer: ['M3', 'M4', 'M1', 'M2', 'E30', 'E36', '2002', 'Z4', 'Z3'], models: ['M3', 'M4', 'M1', 'M2', 'E30', 'E36', '2002', 'Z4', 'Z3', '3.0 CSL', 'i8', 'X5', 'M5'] },
  { make: 'Mercedes-Benz', region: 'European', aliases: ['Mercedes-Benz', 'Mercedes', 'Benz'], infer: ['AMG', 'Gullwing', 'SLS', 'SLR', 'C63'], models: ['AMG', 'Gullwing', 'SLS', 'SLR', 'C63', '300SL', 'G-Class', 'G-Wagen', 'CLK', 'Unimog'] },
  { make: 'Audi', region: 'European', aliases: ['Audi'], infer: ['Quattro', 'R8', 'RS6', 'TT'], models: ['Quattro', 'R8', 'RS6', 'TT', 'A1', 'S1'] },
  { make: 'Volkswagen', region: 'European', aliases: ['Volkswagen', 'VW'], infer: ['Beetle', 'Golf', 'Bug', 'Karmann', 'Kombi', 'T1', 'T2'], models: ['Beetle', 'Golf', 'GTI', 'Bug', 'Karmann Ghia', 'Kombi', 'T1', 'T2', 'Bus', 'Baja Bug', 'Scirocco', 'Corrado'] },
  { make: 'Volvo', region: 'European', aliases: ['Volvo'], infer: ['240', '850', 'P1800'], models: ['240', '850', 'P1800', '242'] },
  { make: 'Fiat', region: 'European', aliases: ['Fiat'], infer: ['500'], models: ['500', '124', '131', 'Abarth'] },
  { make: 'Alfa Romeo', region: 'European', aliases: ['Alfa Romeo', 'Alfa'], infer: ['Giulia', 'Giulietta'], models: ['Giulia', 'Giulietta', '4C', '33 Stradale', 'GTV'] },
  { make: 'Lancia', region: 'European', aliases: ['Lancia'], infer: ['Stratos', 'Delta'], models: ['Stratos', 'Delta', 'Delta Integrale', '037'] },
  { make: 'Lotus', region: 'European', aliases: ['Lotus'], infer: ['Esprit', 'Elise', 'Exige', 'Europa'], models: ['Esprit', 'Elise', 'Exige', 'Europa', 'Evora', 'Seven'] },
  { make: 'Jaguar', region: 'European', aliases: ['Jaguar', 'Jag'], infer: ['E-Type', 'XK', 'XJ', 'D-Type'], models: ['E-Type', 'XK', 'XJ', 'D-Type', 'XKR', 'F-Type'] },
  { make: 'Aston Martin', region: 'European', aliases: ['Aston Martin', 'Aston'], infer: ['Vantage', 'DB5', 'DB9', 'Vulcan', 'Valkyrie'], models: ['Vantage', 'DB5', 'DB9', 'DB11', 'Vulcan', 'Valkyrie', 'DBS', 'One-77'] },
  { make: 'Bentley', region: 'European', aliases: ['Bentley'], infer: ['Continental'], models: ['Continental', 'Bentayga'] },
  { make: 'Bugatti', region: 'European', aliases: ['Bugatti'], infer: ['Veyron', 'Chiron'], models: ['Veyron', 'Chiron', 'Type 35', 'Divo'] },
  { make: 'McLaren', region: 'European', aliases: ['McLaren'], infer: ['F1', 'P1', '720S', '570S', 'Senna'], models: ['F1', 'P1', '720S', '570S', 'Senna', 'MP4-12C', 'Speedtail'] },
  { make: 'Maserati', region: 'European', aliases: ['Maserati'], infer: ['MC12', 'GranTurismo', 'Ghibli'], models: ['MC12', 'GranTurismo', 'Ghibli', 'Bora', 'Quattroporte'] },
  { make: 'Renault', region: 'European', aliases: ['Renault'], infer: ['Alpine', '5 Turbo'], models: ['Alpine', '5 Turbo', 'Clio', 'A110', 'Megane'] },
  { make: 'Peugeot', region: 'European', aliases: ['Peugeot'], infer: ['205', '208'], models: ['205', '208', '405', '504'] },
  { make: 'Mini', region: 'European', aliases: ['Mini', 'Mini Cooper'], infer: ['Cooper'], models: ['Cooper', 'Countryman'] },
  { make: 'Land Rover', region: 'European', aliases: ['Land Rover', 'Range Rover'], infer: ['Defender', 'Range Rover'], models: ['Defender', 'Range Rover', 'Discovery'] },
  { make: 'Koenigsegg', region: 'European', aliases: ['Koenigsegg'], infer: ['Agera', 'Jesko', 'Regera'], models: ['Agera', 'Jesko', 'Regera', 'CCX'] },
  { make: 'Pagani', region: 'European', aliases: ['Pagani'], infer: ['Zonda', 'Huayra'], models: ['Zonda', 'Huayra'] },
  { make: 'Rolls-Royce', region: 'European', aliases: ['Rolls-Royce', 'Rolls Royce'], infer: ['Silver Shadow', 'Phantom', 'Wraith'], models: ['Silver Shadow', 'Phantom', 'Wraith', 'Ghost'] },
  { make: 'De Tomaso', region: 'European', aliases: ['De Tomaso'], infer: ['Pantera', 'Mangusta'], models: ['Pantera', 'Mangusta'] },
  { make: 'MG', region: 'European', aliases: ['MG'], infer: ['MGB', 'MGA'], models: ['MGB', 'MGA', 'Midget'] },
  { make: 'Triumph', region: 'European', aliases: ['Triumph'], infer: ['Spitfire', 'TR6'], models: ['Spitfire', 'TR6', 'TR3', 'TR4'] },
  { make: 'Opel', region: 'European', aliases: ['Opel'], infer: ['Manta', 'GT'], models: ['Manta', 'GT', 'Kadett'] },
  { make: 'AC', region: 'European', aliases: ['AC'], infer: ['Cobra'], models: ['Cobra', 'Ace'] },
  { make: 'Lola', region: 'European', aliases: ['Lola'], infer: ['T70', 'GT70'], models: ['T70', 'GT70'] },
  { make: 'Studebaker', region: 'American', aliases: ['Studebaker'], infer: ['Avanti'], models: ['Avanti', 'Champion', 'Lark'] },
  { make: 'GMC', region: 'American', aliases: ['GMC'], infer: ['Syclone', 'Sierra'], models: ['Syclone', 'Sierra', 'Vandura', 'Jimmy'] },
  { make: 'International', region: 'American', aliases: ['International Harvester', 'International'], infer: ['Scout'], models: ['Scout', 'Loadstar'] },
  { make: 'Willys', region: 'American', aliases: ['Willys'], infer: [], models: ['Coupe', 'Gasser', 'Jeep'] },
  { make: 'Chaparral', region: 'American', aliases: ['Chaparral'], infer: ['2D', '2E', '2F', '2G'], models: ['2D', '2E', '2F', '2G'] },
  { make: 'Saleen', region: 'American', aliases: ['Saleen'], infer: ['S7'], models: ['S7'] },
  { make: 'Holden', region: 'Australian', aliases: ['Holden'], infer: ['Commodore', 'Monaro', 'Torana'], models: ['Commodore', 'Monaro', 'Torana', 'Maloo', 'Ute'] },
  { make: 'Hyundai', region: 'Korean', aliases: ['Hyundai'], infer: ['Veloster'], models: ['Veloster', 'Genesis', 'Tiburon', 'i30', 'Ioniq'] },
  { make: 'Kia', region: 'Korean', aliases: ['Kia'], infer: ['Stinger'], models: ['Stinger', 'Soul'] },
];

// HW original / fantasy castings (not based on a real production car).
const FANTASY = ['Twin Mill', 'Bone Shaker', 'Deora', 'Rodger Dodger', 'Sharkruiser', "Splittin' Image", 'Silhouette', 'Beatnik Bandit', 'Hot Heap', 'Sweet 16', 'Torero', 'Python', 'Turbofire', 'Whip Creamer', 'Sand Crab', 'Boss Hoss', 'King Kuda', 'Ice T', 'TNT-Bird', 'Sugar Caddy', 'Mighty Maverick', 'Evil Weevil', 'Bye Focal', 'Buzz Off', 'Street Snorter', 'Jet Threat', 'Rigor Motor', 'Rocket Oil Special', 'Power Pistons', 'Zombot', 'Sling Shot', 'Phantastique', 'Twinduction', 'Rocket Box', 'Fright Bike', 'Mega Duty', 'Tantrum', 'Gazella', 'Fast Fish', 'Sky Knife', 'Hammered Coupe', 'Super Stinger', 'Baja Bone Shaker', 'Mad Propz', 'Skull Crusher', 'Loopster', 'Prototype H-24', 'Carbonator', 'RD-08', 'RD-03'];

// Licensed entertainment vehicles whose names collide with real makes/models
// ("Colonial Viper" != Dodge, "Millennium Falcon" != Ford). Matching one forces
// Fantasy and blocks make inference.
const FRANCHISE = [
  'Battlestar Galactica', 'Colonial Viper', 'Cylon', 'Millennium Falcon', 'Star Wars', 'TIE Fighter',
  'X-Wing', 'Darth', 'Stormtrooper', 'Boba Fett', 'R2-D2', 'BB-8', 'Death Star', 'Landspeeder',
  'Batmobile', 'The Bat', 'Tumbler', 'Ecto-1', 'Ghostbusters', 'Mystery Machine', 'Scooby',
  'K.I.T.T', 'KITT', 'Knight Rider', 'Mach 5', 'Speed Racer', 'Mario Kart', 'Bowser', 'Yoshi',
  'Hello Kitty', 'Snoopy', 'Simpsons', 'SpongeBob', 'Star Trek', 'U.S.S. Enterprise', 'Jurassic',
  'Flintstones', 'Homer', 'Mooncraft', 'Sub Terrordactyl',
];

// Themes layered on top of make/model (a casting can carry several).
const SUPERCAR_MAKES = new Set(['Ferrari', 'Lamborghini', 'McLaren', 'Bugatti', 'Pagani', 'Koenigsegg', 'Maserati']);
// Supercars from makes that aren't supercar-only (so Nissan GT-R, Honda NSX,
// Ford GT etc. land under "Supercar" alongside their make).
const SUPERCAR_MODELS = ['GT-R', 'NSX', 'LFA', 'Ford GT', 'GT40', 'Carrera GT', 'Saleen S7', 'Ford GT40'];
const MUSCLE_MODELS = ['Camaro', 'Mustang', 'Charger', 'Challenger', 'Chevelle', 'GTO', 'Road Runner', 'Roadrunner', 'Barracuda', 'Cuda', 'Nova', 'Firebird', 'Torino', 'Super Bee', '442', 'Boss', 'Mach 1', 'Fairlane', 'Galaxie', 'Superbird', 'GTX', 'Grand National', 'GSX', 'Trans Am', 'GT350', 'GT500', 'AMX', 'Javelin'];
const JDM_MODELS = ['Skyline', 'GT-R', 'Supra', 'RX-7', 'RX-8', 'NSX', 'Silvia', '240SX', 'AE86', 'Lancer Evolution', 'Impreza', 'WRX', 'Miata', 'MX-5', '350Z', '370Z', 'Civic', 'Integra', 'S2000', 'Celica', 'Fairlady', '2000GT', 'Trueno', 'Type R'];

const name = (lnk) => { const s = lnk.replace(/_/g, ' '); try { return decodeURIComponent(s); } catch { return s; } };

// The real car's model year. Name is most reliable; then the first sentence of
// the description; then, as a best effort, the first vintage year anywhere in
// the description.
// A 2-digit year -> full year. If "20yy" would be in the future it can't be a
// model year, so it's "19yy" ('27 -> 1927, not 2027; '57 -> 1957; '24 -> 2024).
const NOW_YEAR = new Date().getFullYear();
const yy2year = (yy) => { const f = 2000 + yy; return f > NOW_YEAR ? 1900 + yy : f; };

function modelYear(n, dsc) {
  // Drop "(YYYY)" disambiguators — that's the casting's debut year, not the car's.
  const nn = n.replace(/\([^)]*\)/g, ' ').trim();
  // A 4-digit year is the model year only as a prefix ("1932 Ford", "1936 Cord",
  // "Custom 1957 ...") — a year mid-name or after a dash is usually a franchise
  // reference ("Back to the Future - 1955"), not the car's year.
  let m = nn.match(/^(?:custom\s+|classic\s+)?(19[0-9]\d|20[0-2]\d)\b/i);
  if (m) return Number(m[1]);
  m = nn.match(/'(\d{2})\b/);
  if (m) return yy2year(Number(m[1]));
  // A year at the VERY START of the description ("The 1957 Chevrolet ...") is the
  // model year. (A bare year mid-sentence is usually nameplate history —
  // "produced since 1948" — which mislabels modern castings.)
  m = (dsc || '').match(/^(?:The\s+)?(19[0-9]\d|20[0-2]\d)\b/);
  if (m) return Number(m[1]);
  // A year stated next to a GENERATION reference is the specific generation's
  // year, not the nameplate's: "second generation, introduced in 1980",
  // "third generation ... produced from 1982".
  m = (dsc || '').match(
    /(?:(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)[- ]gen\w*|\bgeneration\b|\bmk\.?\s*[ivx\d]+\b)[^.]{0,55}?\b(19[0-9]\d|20[0-2]\d)\b/i
  );
  if (m) return Number(m[1]);
  // An explicit "based off / represents / depicts a '68 Camaro" reference is the
  // real car's year (vs the surrounding "1969 Hot Wheels line-up" casting year).
  m = (dsc || '').match(
    /\b(?:based o[nf]+|patterned after|modell?ed after|replica of|inspired by|represent\w*|depict\w*|portray\w*|recreat\w*|reproduc\w*|emulat\w*|resembl\w*)\b[^.]{0,40}?(?:'(\d{2})\b|\b(19[0-9]\d|20[0-2]\d))\b/i
  );
  if (m) return m[1] ? yy2year(Number(m[1])) : Number(m[2]);
  // A CLOSED production span in the description ("manufactured ... from 1954 to
  // 2000", "produced 1969-1974", "sold from 1964 to 1967") -> the start year.
  // Anchored on a production verb and requires an END year, so open-ended
  // nameplate history ("produced since 1948", "...to present") is ignored — that
  // was the source of earlier false positives on modern castings.
  m = (dsc || '').match(
    /\b(?:produced|manufactured|built|made|sold|in production)\b[^.]{0,40}?\b(19[0-9]\d|20[0-2]\d)\s*(?:–|—|-|to|and|until|through)\s*(?:19[0-9]\d|20[0-2]\d)\b/i
  );
  if (m) return Number(m[1]);
  // Real-car year tied to a maker verb. Hot Wheels casting clauses ("...in the
  // 1969 Hot Wheels line-up") are stripped first so their RELEASE year isn't read
  // as the car's: "Mercedes-Benz introduced the 280 SL in 1968" -> 1968.
  const carDsc = (dsc || '').replace(/[^.]*\b(?:hot\s*wheels|line[\s-]?up|mattel|casting|series|treasure hunt|first edition|mainline)\b[^.]*\.?/gi, ' ');
  m = carDsc.match(
    /\b(?:introduced|unveiled|debuted|launched|presented|revealed|premiered|developed|built|produced|manufactured|designed|created)\b[^.]{0,35}?\b(?:in|at|for|during)\b[^.]{0,18}?(19[0-9]\d|20[0-2]\d)\b/i
  );
  if (m) return Number(m[1]);
  m = carDsc.match(/\bfor the\s+(19[0-9]\d|20[0-2]\d)\s+(?:can-am|season|model year|formula|grand prix|le\s*mans|championship)/i);
  if (m) return Number(m[1]);
  return null;
}
// A decade reference in the name -> the decade's start year ('50s/50s/1950s ->
// 1950). Two-digit decades follow the same 30+ => 1900s rule as model years.
function decadeInName(n) {
  const m = n.match(/(?:^|[\s(])'?((?:19|20)?\d0)s\b/i);
  if (!m) return null;
  let v = Number(m[1]);
  if (v < 100) v = v >= 30 ? 1900 + v : 2000 + v;
  return v;
}
const esc = (w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
const has = (n, w) => new RegExp('\\b' + esc(w) + '\\b', 'i').test(n);

// A description that places the casting in fiction (a character/vehicle from a
// movie/comic/game), so a name like "Valkyrie" or "Viper" isn't a real make.
// NOT used to override an explicit make in the name — real cars get issued in
// Marvel/DC branded series ('67 Ford Bronco, '34 Dodge Delivery), so this only
// blocks weak (inferred) or no-make matches.
const FRANCHISE_DESC = /\bMarvel\b|\bDC Comics\b|Cinematic Universe|\bas played by\b|\bvoiced by\b|from the .{0,25}(?:franchise|video game|cartoon|anime|comic)/i;

function classify(n, dsc) {
  let make = null;
  let region = null;
  let model = null;

  // 0) licensed franchise vehicle (by name) -> Fantasy, never a real make.
  if (FRANCHISE.some((w) => has(n, w))) return { make: null, region: null, model: null, themes: ['Fantasy'] };

  // 1) explicit make alias.
  for (const m of MAKES) {
    if (m.aliases.some((a) => has(n, a))) { make = m.make; region = m.region; break; }
  }
  // 2) no make written -> infer from an iconic model.
  let viaInfer = false;
  if (!make) {
    for (const m of MAKES) {
      const hit = m.infer.find((mod) => has(n, mod));
      if (hit) { make = m.make; region = m.region; model = `${m.make} ${hit}`; viaInfer = true; break; }
    }
  }
  // A fiction-flavoured description demotes a weak/absent make to Fantasy: a bare
  // "Valkyrie" (inferred Aston Martin) described as a Marvel character is fantasy,
  // but an explicitly-named "Aston Martin Valkyrie" stays a real car.
  if ((!make || viaInfer) && FRANCHISE_DESC.test(dsc || '')) {
    return { make: null, region: null, model: null, themes: ['Fantasy'] };
  }
  // 3) specific model within the known make (longest match wins).
  if (make && !model) {
    const m = MAKES.find((x) => x.make === make);
    const hit = [...m.models].sort((a, b) => b.length - a.length).find((mod) => has(n, mod));
    if (hit) model = `${make} ${hit}`;
  }

  const themes = [];
  if ((make && SUPERCAR_MAKES.has(make)) || SUPERCAR_MODELS.some((w) => has(n, w))) themes.push('Supercar');
  if (MUSCLE_MODELS.some((w) => has(n, w))) themes.push('Muscle');
  if (JDM_MODELS.some((w) => has(n, w))) themes.push('JDM');
  // Fantasy: a known HW original, or a no-make casting whose name matches one.
  if (!make && FANTASY.some((w) => has(n, w))) themes.push('Fantasy');

  return { make, region, model, themes };
}

const db = JSON.parse(fs.readFileSync(DB, 'utf8'));

// Approximate model years (lnk -> year), curated from Wikipedia production spans
// and generation lookups (scripts/propose-model-years*.js). Committed so a clean
// rebuild is reproducible. Applied only as a gap-filler, marked ye:1 (shown ≈).
const estimates = new Map();
{
  const ef = path.join('data', 'model-year-estimates.json');
  if (fs.existsSync(ef)) {
    for (const [lnk, y] of Object.entries(JSON.parse(fs.readFileSync(ef, 'utf8')))) estimates.set(lnk, y);
  }
}
// Curated manual corrections (lnk -> year, or null to suppress). Highest priority.
const overrides = new Map();
{
  const of = path.join('data', 'model-year-overrides.json');
  if (fs.existsSync(of)) {
    for (const [lnk, yr] of Object.entries(JSON.parse(fs.readFileSync(of, 'utf8')))) overrides.set(lnk, yr);
  }
}

const out = [];
const byMake = {};
const byRegion = {};
let withMake = 0;
const unmatched = [];

for (const c of db) {
  const n = name(c.lnk);
  const t = classify(n, c.dsc);
  // Model year + decade era. Only trust it for a REAL car: the year is in the
  // name, or the casting has a make. Fantasy/original castings (no make, no year
  // in the name) are skipped — a stray year in their prose isn't a model year.
  const nameClean = n.replace(/\([^)]*\)/g, ' ').trim();
  const nameHasYear = /^(?:custom\s+|classic\s+)?(19[0-9]\d|20[0-2]\d)\b/i.test(nameClean) || /'\d{2}\b/.test(nameClean);
  // A decade reference in the name ('50s, 70s, 1950s) is an ERA, not a precise
  // model year. Tag the era, but never assign a fake year (and don't let the
  // first-casting estimate invent one that contradicts it, e.g. "'50s ... 1997").
  const nameDecade = decadeInName(nameClean);
  const my = modelYear(n, c.dsc);
  let yr = my && !t.themes.includes('Fantasy') && (nameHasYear || t.make) ? my : null;
  // Fall back to an approximate year (Wikipedia span / generation lookup). Marked
  // ye:1 so the UI renders it as ≈. Never overrides a parsed year, and never for
  // decade-named or Fantasy castings.
  let est = 0;
  if (!yr && !nameDecade && !t.themes.includes('Fantasy')) {
    const ey = estimates.get(c.lnk);
    if (ey) { yr = ey; est = 1; }
  }
  // Curated override wins over everything (a number = authoritative year shown as
  // exact; null suppresses any year).
  if (overrides.has(c.lnk)) { yr = overrides.get(c.lnk) || null; est = 0; }
  if (yr && yr >= 1930 && yr <= 1999) t.themes.push(`${Math.floor(yr / 10) * 10}s`);
  // A decade in the name tags the era too — but NOT for Fantasy castings
  // ("1940s Batmobile" is a fantasy car, not a real 1940s model).
  if (nameDecade && nameDecade >= 1930 && nameDecade <= 1999 && !t.themes.includes('Fantasy') && !t.themes.includes(`${nameDecade}s`)) {
    t.themes.push(`${nameDecade}s`);
  }
  out.push({ lnk: c.lnk, name: n, yr: yr || undefined, ye: est || undefined, ...t });
  if (t.make) { withMake++; byMake[t.make] = (byMake[t.make] || 0) + 1; if (t.region) byRegion[t.region] = (byRegion[t.region] || 0) + 1; }
  else unmatched.push(n);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

// Lean runtime files (committed, bundled): per-casting tags + a browse index.
const tagged = out
  .filter((o) => o.make || o.themes.length || o.yr)
  .map((o) => ({ lnk: o.lnk, mk: o.make || undefined, rg: o.region || undefined, md: o.model || undefined, th: o.themes.length ? o.themes : undefined, yr: o.yr || undefined, ye: o.ye || undefined }));
// Browse index: each category -> its makes with counts, so the home page can
// show "category -> makes" and a make click filters within it. Decade eras
// (e.g. "1950s") are kept in their own group, ordered chronologically.
const regions = {};
const themes = {};
const eras = {};
const isEra = (s) => /^\d{4}s$/.test(s);
const add = (bucket, cat, make) => {
  const c = (bucket[cat] ??= { total: 0, makes: {} });
  c.total++;
  if (make) c.makes[make] = (c.makes[make] || 0) + 1;
};
for (const o of out) {
  if (o.region) add(regions, o.region, o.make);
  for (const th of o.themes) add(isEra(th) ? eras : themes, th, o.make);
}
fs.writeFileSync(path.join('data', 'casting-tags.json'), JSON.stringify(tagged));
fs.writeFileSync(path.join('data', 'tags-index.json'), JSON.stringify({ regions, themes, eras }, null, 2));

console.log(`castings: ${db.length}`);
console.log(`with make: ${withMake} (${(withMake / db.length * 100).toFixed(0)}%) | unmatched: ${unmatched.length}`);
console.log('by region:', byRegion);
console.log('\ntop makes:');
Object.entries(byMake).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([m, c]) => console.log(`  ${String(c).padStart(4)}  ${m}`));
const themed = (th) => out.filter((o) => o.themes.includes(th)).length;
console.log('\nthemes:', { Supercar: themed('Supercar'), Muscle: themed('Muscle'), JDM: themed('JDM'), Fantasy: themed('Fantasy') });
console.log(`\nwith specific model: ${out.filter((o) => o.model).length}`);
console.log('\nsample unmatched (no make):');
unmatched.slice(0, 25).forEach((n) => console.log('  ' + n));
console.log(`\n[+] full mapping -> ${OUT}`);
