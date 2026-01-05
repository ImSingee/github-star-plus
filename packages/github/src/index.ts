import { Octokit } from 'octokit';

let client: Octokit | undefined;

export function getOctokit(): Octokit {
  if (!client) {
    const token = process.env.PERSONAL_GITHUB_TOKEN;
    client = new Octokit({
      auth: token,
    });
  }

  return client;
}

export type OctokitInstance = Octokit;
export type octokit = OctokitInstance;

export function hasNextPage(headersNext: string | undefined) {
  return (headersNext || '').includes('rel="next"');
}
