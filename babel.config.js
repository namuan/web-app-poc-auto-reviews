module.exports = function configureBabel(api) {
  const reachability = process.env.REACHABILITY === 'true';
  api.cache.using(() => reachability);

  return {
    presets: [
      ['@babel/preset-env', { targets: 'defaults' }],
      ['@babel/preset-react', { runtime: 'automatic' }],
      '@babel/preset-typescript'
    ],
    plugins: reachability
      ? [
          [
            'istanbul',
            {
              include: ['src/**/*.{js,jsx,ts,tsx}'],
              exclude: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*', '**/*.d.ts']
            }
          ]
        ]
      : []
  };
};
