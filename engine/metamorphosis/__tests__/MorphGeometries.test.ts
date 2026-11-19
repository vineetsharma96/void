import { MorphGeometries, MorphPointCloud } from "../MorphGeometries";
import { RealmId } from "../../state/useWorldStore";

describe("MorphGeometries", () => {
  const EXPECTED_ARRAY_LENGTH = MorphGeometries.POINT_COUNT * 3;

  describe("sampleRealmPoints", () => {
    it("should return valid points for 'origin' realm", () => {
      const result = MorphGeometries.sampleRealmPoints("origin");
      validateMorphPointCloud(result);
    });

    it("should return valid points for 'forest' realm", () => {
      const result = MorphGeometries.sampleRealmPoints("forest");
      validateMorphPointCloud(result);
    });

    it("should return valid points for 'ocean' realm", () => {
      const result = MorphGeometries.sampleRealmPoints("ocean");
      validateMorphPointCloud(result);
    });

    it("should return valid points for 'machine' realm", () => {
      const result = MorphGeometries.sampleRealmPoints("machine");
      validateMorphPointCloud(result);
    });

    it("should return valid points for 'void' realm", () => {
      const result = MorphGeometries.sampleRealmPoints("void");
      validateMorphPointCloud(result);
    });

    it("should fallback to 'origin' points for unknown realm", () => {
      const unknownRealm = "unknown-realm" as RealmId;
      const result = MorphGeometries.sampleRealmPoints(unknownRealm);
      validateMorphPointCloud(result);

      // Optionally, verify it matches origin points. Since they involve Math.random(),
      // we just check structural validity for now, as testing identical output requires seeding.
    });
  });

  function validateMorphPointCloud(result: MorphPointCloud) {
    // 1. Assert result structure
    expect(result).toBeDefined();
    expect(result.positions).toBeInstanceOf(Float32Array);
    expect(result.colors).toBeInstanceOf(Float32Array);

    // 2. Assert array lengths
    expect(result.positions.length).toBe(EXPECTED_ARRAY_LENGTH);
    expect(result.colors.length).toBe(EXPECTED_ARRAY_LENGTH);
  }
});
