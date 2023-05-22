// webpack.config.ts
import type { Configuration } from 'webpack';
import  webpack  from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';

const config = async (env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {
    // Add custom config here...
    resolve: {
        fallback: {
            "assert": require.resolve('assert'),
            "stream": require.resolve("stream-browserify"),
            "vm": require.resolve("vm-browserify")
        }
    },
    plugins: [
      // fix "process is not defined" error:
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ]
  });
};

export default config;