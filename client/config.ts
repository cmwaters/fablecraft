
// Global config
// TODO: maybe represent this as a JSON file
export const Config = {
    name: "Fablecraft",
    card: {
      width: {
          min: 400,
          max: 600
      },
      toolbarHeight: 42
    },

    margin: {
      pillar: 60,
      family: 20,
      card: 10,
    },

    notifier: {
      displayTimeMS: 6000
    },
    
    window: {
      refreshRate: 30,
    },

    movement: {
      proportionalGain: 0.18,
      integralGain: 0.005,
    },

}