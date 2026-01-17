/**
 * Astro API route that generates /.well-known/skills/index.json.
 * Runs at build time (static) or request time (SSR) depending on your Astro config.
 *
 * Scans public/.well-known/skills/ for skill directories, parses YAML frontmatter
 * from each SKILL.md, and outputs a JSON index per the Agent Skills Discovery spec.
 *
 * Usage: Place this file at src/pages/.well-known/skills/index.json.ts
 * Skills: Place skill directories at public/.well-known/skills/{name}/SKILL.md
 *
 * Requires: gray-matter (npm install gray-matter)
 */
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";

interface Skill {
	name: string;
	description: string;
}

export async function GET() {
	const skillsDir = join(process.cwd(), "public/.well-known/skills");

	let entries;
	try {
		entries = await readdir(skillsDir, { withFileTypes: true });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return Response.json({ skills: [] });
		}
		throw error;
	}

	const skillDirs = entries.filter((e) => e.isDirectory());
	const skills: Skill[] = [];

	for (const dir of skillDirs) {
		const skillPath = join(skillsDir, dir.name, "SKILL.md");

		try {
			const content = await readFile(skillPath, "utf-8");
			const { data } = matter(content);

			if (data.name && data.description) {
				skills.push({
					name: data.name,
					description: data.description,
				});
			} else {
				console.warn(`Skill ${dir.name} missing required frontmatter (name/description)`);
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				console.warn(`Failed to parse skill ${dir.name}:`, error);
			}
		}
	}

	skills.sort((a, b) => a.name.localeCompare(b.name));

	return Response.json({ skills });
}
