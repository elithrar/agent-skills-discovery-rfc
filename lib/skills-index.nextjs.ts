/**
 * Next.js Route Handler that generates /.well-known/skills/index.json.
 *
 * Scans public/.well-known/skills/ for skill directories, parses YAML frontmatter
 * from each SKILL.md, and outputs a JSON index per the Agent Skills Discovery spec.
 *
 * Usage: Place this file at app/.well-known/skills/index.json/route.ts
 * Skills: Place skill directories at public/.well-known/skills/{name}/SKILL.md
 *
 * Requires: gray-matter (npm install gray-matter)
 */
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";
import { NextResponse } from "next/server";

interface Skill {
	name: string;
	description: string;
}

export async function GET() {
	const skillsDir = join(process.cwd(), "public/.well-known/skills");

	const entries = await readdir(skillsDir, { withFileTypes: true });
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
			}
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				console.warn(`Failed to parse skill ${dir.name}:`, error);
			}
		}
	}

	skills.sort((a, b) => a.name.localeCompare(b.name));

	return NextResponse.json({ skills });
}
