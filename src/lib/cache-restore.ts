import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { State } from "./constants";

export const restoreCache = async (
  primaryKey: string,
  cachePaths: string[]
) => {
  core.saveState(State.CachePaths, cachePaths);
  core.debug(`primary key is ${primaryKey}`);
  core.saveState(State.CachePrimaryKey, primaryKey);
  const cacheKey = await cache.restoreCache(cachePaths, primaryKey);
  core.setOutput("cache-hit", Boolean(cacheKey));

  if (!cacheKey) {
    core.info(`Cache miss!`);
    return;
  } else {
    core.info(`Cache restored from key: ${cacheKey}`);
  }

  core.saveState(State.CacheMatchedKey, cacheKey);
};
