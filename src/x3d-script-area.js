const MONACO_VERSION = $(`script[src*="monaco-editor"]`) .attr ("src") .match (/\/monaco-editor(@?.*?)\//) [1];

// Also change version on the website!
require .config ({ paths: { "vs": `https://cdn.jsdelivr.net/npm/monaco-editor${MONACO_VERSION}/min/vs` }});

class X3DScriptAreaElement extends HTMLElement
{
   static #canvas;

   #browser;
   #scene;
   #editor;
   #model;
   #area;
   #title;
   #editable;
   #bottom;
   #buttons;
   #run;
   #reset;
   #output;
   #console;

   constructor ()
   {
      super ();

      const shadow = $(this .attachShadow ({ mode: "open", delegatesFocus: true }));

      $("<style></style>") .text (/* CSS */ `
:host {
   display: block;
   width: 100%;
   height: 360px;
}

.area.light {
   --text-color: #272727;
   --border-color: rgb(190, 190, 190);
   --highlight-color: rgba(0, 0, 0, 0.1);
}

.area.dark {
   --text-color: rgb(206, 206, 206);
   --border-color: rgb(68, 68, 68);
   --highlight-color: rgba(255, 255, 255, 0.1);
}

.area {
   box-sizing: border-box;
   display: flex;
   flex-direction: column;
   width: 100%;
   height: 100%;
   border: 1px solid var(--border-color);
   border-radius: 10px;
   font-size: 12pt;
}

.title {
   box-sizing: border-box;
   flex: 0 0 auto;
   padding: 8px;
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

.output {
   box-sizing: border-box;
   flex: 1 1 auto;
   height: 100%;
   border-left: 1px solid var(--border-color);
}

.console {
   box-sizing: border-box;
   overflow: scroll;
   width: 100%;
   height: 100%;
   background: none;
   outline: none;
   border: none;
   resize: none;
   padding: 8px;
   font-family: monospace;
   font-size: 10pt;
}

.console p {
   margin: 1px 0;
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

      this .#title = $("<div></div>")
         .addClass ("title")
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
         .addClass ("button")
         .text ("Run")
         .on ("click", () => this .run ())
         .appendTo (this .#buttons);

      this .#reset = $("<button></button>")
         .addClass ("button")
         .text ("Reset")
         .on ("click", () => this .reset ())
         .appendTo (this .#buttons);

      this .#output = $("<div></div>")
         .addClass ("output")
         .appendTo (this .#bottom);

      this .#console = $("<div></div>")
         .addClass ("console")
         .appendTo (this .#output);

      require (["vs/editor/editor.main"], () => this .setup ());
   }

   async setup ()
   {
      // Handle color scheme changes.
      // Must be done at first.

      window .matchMedia ("(prefers-color-scheme: dark)")
         .addEventListener ("change", () => this .changeColorScheme ());

      this .changeColorScheme ();

      // Editor

      const
         canvas = X3DScriptAreaElement .#canvas ??= X3D .createBrowser (),
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
         });

      this .#browser = canvas .browser;
      this .#editor  = editor;
      this .#model   = model;

      // Scene

      this .#scene = await this .#browser .createScene (this .#browser .getProfile ("Full"));

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
      "title",
   ];

   attributeChangedCallback (name, oldValue, newValue)
   {
      switch (name)
      {
         case "title":
         {
            this .#title .text (newValue);
            break;
         }
      }
   }

   run ()
   {
      try
      {
         const
            script = this .#scene .createNode ("Script"),
            text   = this .#editor .getValue ();

         this .wrapConsole ();

         script .getValue () .evaluate (text);

         this .restoreConsole ();
      }
      catch (error)
      {
         console .error (error);
      }
   }

   #consoleKeys = ["log", "warn", "error", "debug"];
   #consoleFunctions = { };

   wrapConsole ()
   {
      for (const fn of this .#consoleKeys)
      {
         this .#consoleFunctions [fn] = console [fn];

         console [fn] = (... args) =>
         {
            this .#consoleFunctions [fn] .call (console, ... args);

            $("<p></p>")
               .append (args .join (" "))
               .appendTo (this .#console);

            this .#console .scrollTop (this .#console .prop ("scrollHeight"));
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
      this .#console .empty ();
   }
}

customElements .define ("x3d-script-area", X3DScriptAreaElement);
