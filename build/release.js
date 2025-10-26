#!/usr/bin/env node
"use strict";

const fs = require ("fs");
const { sh, systemSync } = require ("shell-tools");

function main ()
{
   // dist
   systemSync (`cp src/* docs/`);

   // commit
   systemSync (`git add -A`);
   systemSync (`git commit -am 'Published new version'`);
   systemSync (`git push origin`);
}

main ();
