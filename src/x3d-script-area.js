class X3DScriptAreaElement extends HTMLElement
{
   constructor ()
   {
      super ();

      const shadow = $(this .attachShadow ({ mode: "open", delegatesFocus: true }));

      $("<style></style>")
      .text (`
:host {
   display: block;
   width: 100%;
   aspect-ratio: 16 / 3;
}
      `)
      .appendTo (shadow);

      console .log ("constructor");
   }
}

customElements .define ("x3d-script-area", X3DScriptAreaElement);
