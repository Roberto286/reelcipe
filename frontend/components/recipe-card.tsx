import { Recipe } from "shared";
import { RecipeDashboard } from "../types/recipe-dashboard.d.ts";
import recipeCardBadge from "./recipe-card-badge.tsx";

export default function RecipeCard(props: RecipeDashboard) {
  return (
    <div class="card image-full bg-base-100 w-96 shadow-sm">
      <figure>
        <img
          src={props.imageUrl}
          alt="Shoes"
        />
      </figure>
      <div class="card-body">
        <h2 class="card-title">
          {props.title}
          <div class="badge badge-secondary">{props.rating}/5</div>
        </h2>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Aperiam ea
          dolore quod tempore voluptatibus reiciendis atque architecto saepe
          voluptates impedit.
        </p>
        <div class="card-actions justify-end">
          {props.tags.map((t) => (
            <div key={t.id} class="badge badge-outline">{t.name}</div>
          ))}
        </div>
        <a role="button" class="btn btn-primary" href={`/recipes/${props.id}`}>
          Details
        </a>
      </div>
    </div>
  );
}
