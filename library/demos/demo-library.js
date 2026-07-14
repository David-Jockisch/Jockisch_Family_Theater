const demoLibrary = [
{
  id: "dolby-atmos-amaze",
  title: "Dolby Atmos Amaze",
  type: "demo",
  enabled: true,
  file: "C:\\Users\\david\\Videos\\Theater Media\\03 Demos\\5. Amaze-Dolby-thedigitaltheater.mp4"
},
  {
    id: "dts-x-demo",
    title: "DTS:X Demo",
    type: "demo",
    enabled: true
  },
  {
    id: "imax-countdown",
    title: "IMAX Countdown",
    type: "demo",
    enabled: true
  }
];

if (typeof module !== "undefined") {
  module.exports = demoLibrary;
}