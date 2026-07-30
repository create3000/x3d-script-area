#!/usr/bin/env node
"use strict";

const fs = require ("fs");
const { sh, systemSync } = require ("shell-tools");

function main ()
{
   // dist
   systemSync (`terser -c -m -o docs/x3d-script-area.js src/x3d-script-area.js`);

   // commit
   systemSync (`git add -A`);
   systemSync (`git commit -am 'Published new version'`);
   systemSync (`git push origin`);
}

main ();
