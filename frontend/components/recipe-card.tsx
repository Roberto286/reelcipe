import { RecipeDashboard } from "../types/recipe-dashboard.d.ts";

export default function RecipeCard(props: RecipeDashboard) {
  return (
    <div class="card card-sm bg-base-100 w-96 shadow-sm">
      <figure class="aspect-square">
        <img
          src={`/api/image-proxy?url=${encodeURIComponent(props.imageUrl)}`}
          alt=""
          class="w-full h-full object-cover object-center"
        />
      </figure>
      <div class="card-body">
        <h2 class="card-title">
          {props.title}
          <div class="badge badge-secondary">{props.rating}/5</div>
        </h2>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque nobis
          nisi ex est rem temporibus, deserunt quae aspernatur iusto rerum
          voluptas cupiditate recusandae qui suscipit voluptatum eligendi modi
          totam consectetur minima similique accusantium ipsa alias eius?
          Repellat possimus velit illum, sit quasi veritatis asperiores
          provident voluptatibus, inventore atque omnis nihil!
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
