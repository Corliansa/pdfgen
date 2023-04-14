#!/bin/bash

if [ -d "node_modules" ]; then
    node node_modules/puppeteer-core/install.js
else
    node $(find ../.. -path '*/puppeteer-core/install.js')
fi