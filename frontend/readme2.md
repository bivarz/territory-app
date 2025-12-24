Goal:
Partition the map into contiguous territories, similar to country/state borders.

Each territory:
- Has shared borders with neighboring territories
- Covers the full area
- Has no overlaps and no gaps

Correct GIS approach:
1. Generate a representative point (centroid) for each area
2. Create a Voronoi diagram from these points
3. Clip the Voronoi polygons by a bounding area or city boundary
4. Return the resulting territory polygons

Constraints:
- Use Turf.js
- This is NOT a union or buffer problem
- This is a spatial partitioning problem
- The result must look like a political map (e.g., Brazilian states)

Do NOT:
- Merge all polygons
- Create hulls
- Create overlapping areas

Generate geometry logic only.
