#!/bin/bash
if [ "$CF_PAGES_BRANCH" == "master" ]; then
  cp .env.prod .env
  npm run build
elif [ "$CF_PAGES_BRANCH" == "beta/v2" ]; then
  cp .env.beta .env
  npm run build
else
  cp .env.beta .env
  npm run build
fi