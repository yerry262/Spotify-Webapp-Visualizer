/**
 * Waveform renderer registry.
 *
 * Each waveform lives in its own file in this directory and exports a
 * draw<Name>Wave(ctx, width, height, chroma, mel, beatPulse, time) function.
 * To add a style: create the file, register it here, then add menu entry +
 * defaults in VisualizerAudio.js / waveformCore.js (see repo CLAUDE.md).
 */
import { drawLayeredWave } from './layered';
import { drawOscilloscopeWave } from './oscilloscope';
import { drawBarWave } from './bars';
import { drawRibbonWave } from './ribbon';
import { drawMirroredWave } from './mirrored';
import { drawDottedWave } from './dotted';
import { drawPixelatedWave } from './pixelated';
import { drawMesh3DWave } from './mesh3d';
import { drawGradientBarsWave } from './gradientBars';
import { drawSineLayersWave } from './sineLayers';
import { drawCircularDotsWave } from './circularDots';
import { drawNeonLinesWave } from './neonLines';
import { drawHelixDNAWave } from './helixDna';
import { drawPlasmaFireWave } from './plasmaFire';
import { drawMatrixRainWave } from './matrixRain';
import { drawMatrixRain2Wave } from './matrixRain2';
import { drawAuroraBorealisWave } from './auroraBorealis';
import { drawShockwaveWave } from './shockwave';
import { drawKaleidoscopeWave } from './kaleidoscope';
import { drawLightningWave } from './lightning';
import { drawHeartbeatWave } from './heartbeat';
import { drawFractalTreeWave } from './fractalTree';
import { drawLiquidMercuryWave } from './liquidMercury';
import { drawCosmicNebulaWave } from './cosmicNebula';
import { drawSoundTornadoWave } from './soundTornado';
import { drawGeoMandalaWave } from './geoMandala';
import { drawGlitchArtWave } from './glitchArt';
import { drawGlitchArt2Wave } from './glitchArt2';
import { drawGlitchArt3Wave } from './glitchArt3';
import { drawMinionMayhemWave } from './minionMayhem';
import { drawMazeMysteryWave } from './mazeMystery';
import { drawTerrain3DWave } from './terrain3d';
import { drawFireworksWave } from './fireworks';
import { drawOceanWavesWave } from './oceanWaves';
import { drawGalaxySpiralWave } from './galaxySpiral';
import { drawLavaLampWave } from './lavaLamp';
import { drawSynthwaveHorizonWave } from './synthwaveHorizon';
import { drawVolcanicMagmaWave } from './volcanicMagma';
import { drawNeonCityWave } from './neonCity';
import { drawParticleExplosionWave } from './particleExplosion';
import { drawGalagaWave } from './galaga';
import { drawNeonPongWave } from './neonPong';
import { drawLyricFlowWave } from './lyricFlow';
import { drawPacmanWave } from './pacman';
import { drawSnakeWave } from './snake';
import { drawRainTetrisWave } from './rainTetris';
import { drawDVDBouncerWave } from './dvdBouncer';
import { drawGummyWave } from './gummy';
import { drawSacredGeometryWave } from './sacredGeometry';
import { drawFractalVoidWave } from './fractalVoid';
import { drawQuantumFluxWave } from './quantumFlux';
import { drawWaterRippleWave } from './waterRipple';
import { drawSpirographWave } from './spirograph';
import { drawStarfieldWarpWave } from './starfieldWarp';
import { drawVinylRecordWave } from './vinylRecord';
import { drawSuperGalaxyWave } from '../VisualizerGalaxy';

export { resetSnakeState } from './snake';
export { resetRainTetrisState } from './rainTetris';

export const WAVEFORM_RENDERERS = {
  layered: drawLayeredWave,
  oscilloscope: drawOscilloscopeWave,
  bars: drawBarWave,
  ribbon: drawRibbonWave,
  mirrored: drawMirroredWave,
  dotted: drawDottedWave,
  pixelated: drawPixelatedWave,
  mesh3d: drawMesh3DWave,
  gradient_bars: drawGradientBarsWave,
  sine_layers: drawSineLayersWave,
  circular_dots: drawCircularDotsWave,
  neon_lines: drawNeonLinesWave,
  helix_dna: drawHelixDNAWave,
  plasma_fire: drawPlasmaFireWave,
  matrix_rain: drawMatrixRainWave,
  matrix_rain_2: drawMatrixRain2Wave,
  aurora_borealis: drawAuroraBorealisWave,
  shockwave: drawShockwaveWave,
  kaleidoscope: drawKaleidoscopeWave,
  lightning: drawLightningWave,
  heartbeat: drawHeartbeatWave,
  fractal_tree: drawFractalTreeWave,
  liquid_mercury: drawLiquidMercuryWave,
  cosmic_nebula: drawCosmicNebulaWave,
  sound_tornado: drawSoundTornadoWave,
  geo_mandala: drawGeoMandalaWave,
  glitch_art: drawGlitchArtWave,
  glitch_art_2: drawGlitchArt2Wave,
  glitch_art_3: drawGlitchArt3Wave,
  minion_mayhem: drawMinionMayhemWave,
  maze_mystery: drawMazeMysteryWave,
  terrain_3d: drawTerrain3DWave,
  fireworks: drawFireworksWave,
  ocean_waves: drawOceanWavesWave,
  galaxy_spiral: drawGalaxySpiralWave,
  lava_lamp: drawLavaLampWave,
  synthwave_horizon: drawSynthwaveHorizonWave,
  volcanic_magma: drawVolcanicMagmaWave,
  neon_city: drawNeonCityWave,
  particle_explosion: drawParticleExplosionWave,
  galaga: drawGalagaWave,
  neon_pong: drawNeonPongWave,
  lyric_flow: drawLyricFlowWave,
  pacman: drawPacmanWave,
  snake: drawSnakeWave,
  rain_tetris: drawRainTetrisWave,
  dvd_bouncer: drawDVDBouncerWave,
  gummy: drawGummyWave,
  sacred_geometry: drawSacredGeometryWave,
  fractal_void: drawFractalVoidWave,
  quantum_flux: drawQuantumFluxWave,
  water_ripple: drawWaterRippleWave,
  spirograph: drawSpirographWave,
  starfield_warp: drawStarfieldWarpWave,
  vinyl_record: drawVinylRecordWave,
  super_galaxy: drawSuperGalaxyWave,
};
