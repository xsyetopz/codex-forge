import { join } from "node:path";

export const GENERATED_CATALOG_SOURCE = "generated/model-catalog.json";
export const FALLBACK_CATALOG_SOURCE = join("assets", "model-catalog.json");

export function forgeCatalogTarget(home) {
	return join(home, "forge", "model-catalog.json");
}
