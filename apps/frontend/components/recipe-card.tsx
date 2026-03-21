import type { Recipe } from "@reelcipe/shared";

type RecipeCardProps = Pick<Recipe, "id" | "title" | "imageUrl" | "rating" | "tags"> & {
  description?: string;
};

function formatRating(rating: number): string {
  return rating > 0 ? `${rating}/5` : "Not rated";
}

function getRatingBadgeClass(rating: number): string {
  if (rating === 0) return "badge-ghost";
  if (rating >= 4) return "badge-success";
  if (rating >= 3) return "badge-warning";
  return "badge-error";
}

export default function RecipeCard(props: RecipeCardProps) {
  const imageUrl = props.imageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(props.imageUrl)}`
    : "/logo.svg";

  return (
    <div class="card card-sm bg-base-100 w-72 shadow-sm hover:shadow-lg transition-shadow duration-200">
      <figure class="aspect-square rounded-xl bg-base-200">
        <img
          src={imageUrl}
          alt={props.title}
          class="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== "/logo.svg") {
              target.src = "/logo.svg";
              target.onerror = null; // Prevent infinite loop if fallback also fails
            }
          }}
        />
      </figure>
      <div class="card-body p-4">
        <h2 class="card-title text-lg line-clamp-1">{props.title}</h2>
        <div class="flex items-center gap-2 mt-1">
          <span class={`badge ${getRatingBadgeClass(props.rating)}`}>
            {formatRating(props.rating)}
          </span>
        </div>
        {props.tags && props.tags.length > 0 && (
          <div class="flex flex-wrap gap-1 mt-2">
            {props.tags.slice(0, 3).map((t) => (
              <span key={t.id} class="badge badge-outline badge-sm">{t.name}</span>
            ))}
          </div>
        )}
        <div class="card-actions justify-end mt-3">
          <a class="btn btn-primary btn-sm" href={`/recipes/${props.id}`}>
            View Recipe
          </a>
        </div>
      </div>
    </div>
  );
}
