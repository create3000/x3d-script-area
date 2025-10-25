class X3DScriptAreaElement extends HTMLElement
{
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
      `)
      .appendTo (shadow);

      console .log ("constructor");
   }
}

customElements .define ("x3d-script-area", X3DScriptAreaElement);
