import { define } from "../../utils.ts";

export default define.page(function Recipe(ctx) {
  const { id } = ctx.params;
  return <p>Sono il dettaglio della ricetta {id}</p>;
});
