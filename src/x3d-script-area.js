const MONACO_VERSION = $(`script[src*="monaco-editor"]`) .attr ("src") .match (/\/monaco-editor(@?.*?)\//) [1];

// Also change version on the website!
require .config ({ paths: { "vs": `https://cdn.jsdelivr.net/npm/monaco-editor${MONACO_VERSION}/min/vs` }});

class X3DScriptAreaElement extends HTMLElement
{
   #browser;
   #editor;
   #model;
   #area;
   #title;
   #editable;

   constructor ()
   {
      super ();

      const shadow = $(this .attachShadow ({ mode: "open", delegatesFocus: true }));

      $("<style></style>") .text (/* CSS */ `
:host {
   display: block;
   width: 100%;
   aspect-ratio: 2 / 1;
}

.area.light {
   --text-color: black;
   --border-color: rgb(190, 190, 190);
}

.area.dark {
   --text-color: white;
   --border-color: rgb(68, 68, 68);
}

.area {
   box-sizing: border-box;
   display: flex;
   flex-direction: column;
   width: 100%;
   height: 100%;
   border: 1px solid var(--border-color);
   border-radius: 10px;
   padding-bottom: 30px;
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

      require (["vs/editor/editor.main"], () => this .setup ());
   }

   setup ()
   {
      // Handle color scheme changes.
      // Must be done at first.

      window .matchMedia ("(prefers-color-scheme: dark)")
         .addEventListener ("change", () => this .changeColorScheme ());

      this .changeColorScheme ();

      // Editor

      const
         canvas = X3D .createBrowser (),
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

      model .setValue ($(this) .text () .trim ());
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

}

customElements .define ("x3d-script-area", X3DScriptAreaElement);
