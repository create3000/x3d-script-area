// Also change version on the website!
require .config ({ paths: { "vs": "https://cdn.jsdelivr.net/npm/monaco-editor@0.54.0/min/vs" }});

class X3DScriptAreaElement extends HTMLElement
{
   #browser;
   #editor;
   #model;
   #area;
   #editorElement;

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

.area {
   display: flex;
   width: 100%;
   height: 100%;
   background: blue;
}

.editor {
   width: 100%;
}
      `)
      .appendTo (shadow);

      $("<link/>")
         .attr ("rel", "stylesheet")
         .attr ("href", "https://cdn.jsdelivr.net/npm/monaco-editor@0.54.0/min/vs/editor/editor.main.css")
         .appendTo (shadow);

      this .#area = $("<div></div>")
         .addClass ("area")
         .appendTo (shadow);

      this .#editorElement = $("<div></div>")
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
         editor = monaco .editor .create (this .#editorElement .get (0),
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
      const darkMode = (window .matchMedia ?.("(prefers-color-scheme: dark)") .matches || $("html") .attr ("data-mode") === "dark") && ($("html") .attr ("data-mode") !== "light");

      monaco .editor .setTheme (darkMode ? "vs-dark" : "vs-light");
   }

}

customElements .define ("x3d-script-area", X3DScriptAreaElement);
