// Types for compiled templates
declare module '@fabscale/ember-cognito-identity/templates/*' {
  import { TemplateFactory } from 'htmlbars-inline-precompile';
  const tmpl: TemplateFactory;
  export default tmpl;
}
