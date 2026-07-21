import threeDsGames from "./3ds.js";
import dsGames from "./ds.js";
import gameboyGames from "./gameboy.js";
import gbaGames from "./gba.js";
import gbcGames from "./gbc.js";
import genesisGames from "./genesis.js";
import intellivisionGames from "./intellivision.js";
import n64Games from "./n64.js";
import nesGames from "./nes.js";

import ps1Games from "./ps1.js";
import ps2Games from "./ps2.js";
import ps3Games from "./ps3.js";
import ps4Games from "./ps4.js";
import ps5Games from "./ps5.js";
import pspGames from "./psp.js";
import psvitaGames from "./psvita.js";
import psvrGames from "./psvr.js";

import seriesxGames from "./seriesx.js";
import snesGames from "./snes.js";
import switchGames from "./switch.js";
import wiiGames from "./wii.js";

import xboxGames from "./xbox.js";
import xbox360Games from "./xbox360.js";
import xboxOneGames from "./xboxone.js";

const gameLibrary = [
  ...threeDsGames,
  ...dsGames,
  ...gameboyGames,
  ...gbaGames,
  ...gbcGames,
  ...genesisGames,
  ...intellivisionGames,
  ...n64Games,
  ...nesGames,

  ...ps1Games,
  ...ps2Games,
  ...ps3Games,
  ...ps4Games,
  ...ps5Games,
  ...pspGames,
  ...psvitaGames,
  ...psvrGames,

  ...seriesxGames,
  ...snesGames,
  ...switchGames,
  ...wiiGames,

  ...xboxGames,
  ...xbox360Games,
  ...xboxOneGames
];

export default gameLibrary;
