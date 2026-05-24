export const userCopy = {
  home: {
    processingLocationNoticeTitle: 'Operational processing lives in Build Intelligence',
    processingLocationNoticeBody: 'Home is a strategic overview. Source entry and processing actions are intentionally separated into the dedicated build workspace.',
    latestPackageTitle: 'Latest intelligence package',
    matrixFallbackCapabilities: 'Capabilities are ready for comparison after source processing.',
    matrixFallbackCompetitors: 'Competitor comparisons appear after the next intelligence build.',
    matrixFallbackAdvantages: 'Advantage signals are generated from source-backed findings.',
    mapFallbackGrowth: 'Growth opportunity ranking appears after source processing.',
    mapFallbackSaturation: 'Saturation signals are calculated from competitor overlap.',
    mapFallbackField: 'Field focus zones are produced from capability and geography signals.'
  },
  build: {
    processingUpdateTitle: 'Processing update',
    storageTemporary: 'Storage service is temporarily unavailable. Please retry shortly.',
    delayed: 'Processing is temporarily delayed. Please retry your request.',
    unavailable: 'The intelligence service is temporarily unavailable. Please retry in a moment.',
    pipelineReady: 'Intelligence pipeline active'
  }
} as const;

export const supportCopy = {
  diagnostics: {
    routePrefix: '/api/'
  }
} as const;
