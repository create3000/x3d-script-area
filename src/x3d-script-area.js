const MONACO_VERSION = $(`script[src*="monaco-editor"]`) .attr ("src") .match (/\/monaco-editor(@?.*?)\//) [1];

// Also change version on the website!
require .config ({ paths: { "vs": `https://cdn.jsdelivr.net/npm/monaco-editor${MONACO_VERSION}/min/vs` }});

class X3DScriptAreaElement extends HTMLElement
{
   static #canvas;
   static #browser;

   static {
      // X3D

      this .#canvas  = X3D .createBrowser (),
      this .#browser = this .#canvas .browser;

      // Monaco

      this .addDeclarations ();
   }

   static #internalTypes = new Set ([
      "SFBool",
      "SFDouble",
      "SFFloat",
      "SFInt32",
      "SFString",
      "SFTime",
   ]);

   static async addDeclarations ()
   {
      const
         response     = await fetch ("https://cdn.jsdelivr.net/npm/x_ite@12.1.3/dist/x_ite.d.ts"),
         text         = await response .text (),
         declarations = text .replace (/^.*?(?:export.*?;)/s, "");

      monaco .languages .typescript .javascriptDefaults .setExtraLibs ([
      {
         content: /* ts */ `
            ${declarations};
            declare const Browser: X3D .X3DBrowser;
            declare const X3DConstants: X3D .X3DConstants;
            declare const X3DBrowser: typeof X3D. X3DBrowser;
            declare const X3DExecutionContext: typeof X3D. X3DExecutionContext;
            declare const X3DScene: typeof X3D. X3DScene;
            declare const ComponentInfo: typeof X3D. ComponentInfo;
            declare const ComponentInfoArray: typeof X3D. ComponentInfoArray;
            declare const ProfileInfo: typeof X3D. ProfileInfo;
            declare const ProfileInfoArray: typeof X3D. ProfileInfoArray;
            declare const ConcreteNodesArray: typeof X3D. ConcreteNodesArray;
            declare const AbstractNodesArray: typeof X3D. AbstractNodesArray;
            declare const UnitInfo: typeof X3D. UnitInfo;
            declare const UnitInfoArray: typeof X3D. UnitInfoArray;
            declare const NamedNodesArray: typeof X3D. NamedNodesArray;
            declare const ImportedNodesArray: typeof X3D. ImportedNodesArray;
            declare const X3DImportedNode: typeof X3D. X3DImportedNode;
            declare const ExportedNodesArray: typeof X3D. ExportedNodesArray;
            declare const X3DExportedNode: typeof X3D. X3DExportedNode;
            declare const ExternProtoDeclarationArray: typeof X3D. ExternProtoDeclarationArray;
            declare const ProtoDeclarationArray: typeof X3D. ProtoDeclarationArray;
            declare const X3DExternProtoDeclaration: typeof X3D. X3DExternProtoDeclaration;
            declare const X3DProtoDeclaration: typeof X3D. X3DProtoDeclaration;
            declare const X3DProtoDeclarationNode: typeof X3D. X3DProtoDeclarationNode;
            declare const RouteArray: typeof X3D. RouteArray;
            declare const X3DRoute: typeof X3D. X3DRoute;
            declare const X3DFieldDefinition: typeof X3D. X3DFieldDefinition;
            declare const FieldDefinitionArray: typeof X3D. FieldDefinitionArray;
            declare const X3DField: typeof X3D. X3DField;
            declare const X3DArrayField: typeof X3D. X3DArrayField;
            ${Array .from (X3DScriptAreaElement .#browser .fieldTypes)
               .filter (type => !this .#internalTypes .has (type .typeName))
               .map (type => `declare const ${type .typeName}: typeof X3D .${type .typeName};`)
               .join ("\n")}
            declare const TRUE: true;
            declare const FALSE: false;
            declare const NULL: null;
            declare function print (... args: any []): void;
         `,
      }]);
   }

   #editor;
   #model;
   #area;
   #name;
   #editable;
   #bottom;
   #buttons;
   #run;
   #reset;
   #console;
   #output;

   constructor ()
   {
      super ();

      const shadow = $(this .attachShadow ({ mode: "open" }));

      $("<style></style>") .text (/* CSS */ `
:host {
   display: block;
   width: 100%;
   height: 360px;
   margin: 1rem 0;
}

.area.light {
   --system-red: rgb(255, 56, 60);
   --system-yellow: rgb(255, 204, 0);
   --system-green: rgb(52, 199, 89);
   --system-blue: rgb(0, 136, 255);

   --text-color: rgb(52, 52, 60);
   --border-color: #ececec;
   --highlight-color: rgba(0, 0, 0, 0.1);
   --highlight-bg-color: #f6f8fa;
}

.area.dark {
   --system-red: rgb(255, 66, 69);
   --system-yellow: rgb(255, 214, 0);
   --system-green: rgb(48, 209, 88);
   --system-blue: rgb(0, 145, 255);

   --text-color: rgb(175 176 177);
   --border-color: #2d2d2d;
   --highlight-color: rgba(255, 255, 255, 0.1);
   --highlight-bg-color: #151515;
}

.area {
   box-sizing: border-box;
   display: flex;
   flex-direction: column;
   width: 100%;
   height: 100%;
   border: 1px solid var(--border-color);
   border-radius: 10px;
   background-color: var(--highlight-bg-color);
   font-size: 12pt;
}

.name {
   box-sizing: border-box;
   flex: 0 0 auto;
   padding: 8px 12px;
   font-family: sans-serif;
   font-weight: bold;
   color: var(--text-color);
}

.editor {
   box-sizing: border-box;
   flex: 1 1 auto;
   border-top: 1px solid var(--border-color);
   border-bottom: 1px solid var(--border-color);
   width: 100%;
}

.bottom {
   box-sizing: border-box;
   display: flex;
   flex: 0 0 auto;
   height: 30%;
}

.buttons {
   box-sizing: border-box;
   display: flex;
   flex-direction: column;
   flex: 0 0 auto;
   width: 10%;
}

.button {
   cursor: pointer;
   flex: 0 0 auto;
   padding: 8px;
   font-size: 9pt;
   font-family: sans-serif;
   font-weight: bold;
   color: var(--text-color);
   border: none;
   border-bottom: 1px solid var(--border-color);
   background: none;
}

.button:hover {
   background: var(--highlight-color);
}

.console {
   box-sizing: border-box;
   flex: 1 1 auto;
   height: 100%;
   border-left: 1px solid var(--border-color);
}

.output {
   overflow-y: scroll;
   box-sizing: border-box;
   overflow: auto;
   width: 100%;
   height: 100%;
   background: none;
   outline: none;
   border: none;
   resize: none;
   padding: 8px;
   font-family: monospace;
   font-size: 10pt;
   line-height: 1.2;
   white-space: pre-wrap;
   overflow-wrap: anywhere;
}

.output p {
   margin: 1px 0;
}

.output p.error {
   color: var(--system-red);
}

.output p.warn {
   color: var(--system-yellow);
}

.output p.info {
   color: var(--system-blue);
}
      `)
      .appendTo (shadow);

      $("<link/>")
         .attr ("rel", "stylesheet")
         .attr ("href", `https://cdn.jsdelivr.net/npm/monaco-editor${MONACO_VERSION}/min/vs/editor/editor.main.css`)
         .appendTo (shadow);

      this .#area = $("<div></div>")
         .addClass ("area")
         .appendTo (shadow);

      this .#name = $("<div></div>")
         .addClass ("name")
         .appendTo (this .#area);

      this .#editable = $("<div></div>")
         .addClass ("editor")
         .appendTo (this .#area);

      this .#bottom = $("<div></div>")
         .addClass ("bottom")
         .appendTo (this .#area);

      this .#buttons = $("<div></div>")
         .addClass ("buttons")
         .appendTo (this .#bottom);

      this .#run = $("<button></button>")
         .attr ("title", "Run example and show console output.")
         .addClass ("button")
         .text ("Run")
         .on ("click", () => this .run ())
         .appendTo (this .#buttons);

      this .#reset = $("<button></button>")
         .attr ("title", "Reset example and clear console output.")
         .addClass ("button")
         .text ("Reset")
         .on ("click", () => this .reset ())
         .appendTo (this .#buttons);

      this .#console = $("<div></div>")
         .addClass ("console")
         .appendTo (this .#bottom);

      this .#output = $("<div></div>")
         .attr ("title", "Shows console output.")
         .addClass ("output")
         .appendTo (this .#console);

      require (["vs/editor/editor.main"], () => this .setup ());
   }

   async setup ()
   {
      // Handle color scheme changes.
      // Must be done at first.

      window .matchMedia ("(prefers-color-scheme: dark)")
         .addEventListener ("change", () => this .changeColorScheme ());

      this .changeColorScheme ();

      const observer = new MutationObserver (() => this .changeColorScheme ());

      observer .observe ($("html") .get (0),
      {
         attributes: true,
         attributeFilter: ["data-mode"],
         attributeOldValue: true,
      });

      // Editor

      const
         model  = monaco .editor .createModel ("", "javascript"),
         editor = monaco .editor .create (this .#editable .get (0),
         {
            model: model,
            language: "javascript",
            contextmenu: true,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: "on",
            wrappingIndent: "indent",
            minimap: { enabled: false },
            bracketPairColorization: { enabled: true },
            scrollBeyondLastLine: false,
         });

      this .#editor = editor;
      this .#model  = model;

      this .reset ();
   }

   changeColorScheme ()
   {
      const darkMode = (window .matchMedia ?.("(prefers-color-scheme: dark)") .matches
         || $("html") .attr ("data-mode") === "dark") && ($("html") .attr ("data-mode") !== "light");

      monaco .editor .setTheme (darkMode ? "vs-dark" : "vs-light");

      this .#area
         .removeClass (["light", "dark"])
         .addClass (darkMode ? "dark" : "light");
   }

   static observedAttributes = [
      "name",
   ];

   attributeChangedCallback (name, oldValue, newValue)
   {
      switch (name)
      {
         case "name":
         {
            this .#name .text (newValue);
            break;
         }
      }
   }

   async run ()
   {
      try
      {
         const
            browser = X3DScriptAreaElement .#browser,
            scene   = await browser .createScene (browser .getProfile ("Full")),
            script  = scene .createNode ("Script"),
            text    = this .#editor .getValue ();

         await browser .replaceWorld (scene);

         this .#output .empty ();

         this .wrapConsole ();

         const run = script .getValue () .evaluate (`const run = async function () { ${text} \n};\nrun;`);

         await run ();
      }
      catch (error)
      {
         console .error (error);
      }
      finally
      {
         this .restoreConsole ();

         X3DScriptAreaElement .#browser .getBrowserOptions () .reset ();
      }
   }

   #consoleKeys = ["log", "warn", "error", "debug"];
   #consoleFunctions = { };

   wrapConsole ()
   {
      for (const key of this .#consoleKeys)
      {
         const fn = this .#consoleFunctions [key] = console [key];

         console [key] = (... args) =>
         {
            fn .call (console, ... args);

            $("<p></p>")
               .addClass (key)
               .text (`> ${args .join (" ")}`)
               .appendTo (this .#output);

            this .#output .scrollTop (this .#output .prop ("scrollHeight"));
         };
      }
   }

   restoreConsole ()
   {
      for (const fn of this .#consoleKeys)
         console [fn] = this .#consoleFunctions [fn];
   }

   reset ()
   {
      this .#model .setValue ($(this) .text () .trim ());
      this .#output .empty ();
   }
}

customElements .define ("x3d-script-area", X3DScriptAreaElement);
