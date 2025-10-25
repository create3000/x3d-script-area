class X3DScriptAreaElement extends HTMLElement
{
   constructor ()
   {
      super ();

      this .attachShadow ({ mode: "open", delegatesFocus: true });

      console .log ("constructor");
   }
}

customElements .define ("x3d-script-area", X3DScriptAreaElement);
