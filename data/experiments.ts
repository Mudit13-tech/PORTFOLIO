import type { Experiment } from './types'

/**
 * Test builds — the repositories that exist to answer a question rather than to
 * ship a product. Each one states what was being tested and what came back.
 *
 * `result` and `learned` are the two fields that make an experiment worth
 * publishing, and they are the two only Mudit can fill in honestly. Where they
 * are still TODO the interface renders the gap rather than padding it.
 */
export const experiments: Experiment[] = [
  {
    id: 'langchain-genai',
    name: 'GenAI with LangChain',
    category: 'ai',
    year: 2026,
    tested: 'What LangChain actually does on top of a raw model call.',
    why: 'Wanted to know which parts of an LLM pipeline are the library and which are the model, rather than copying a chain and hoping.',
    result: 'TODO — what you found. 1.5 KB of Python across a handful of files.',
    learned: 'TODO — one or two sentences.',
    source: 'https://github.com/Mudit13-tech/GENAI-USING-LANGCHAIN',
  },
  {
    id: 'python-ml',
    name: 'NumPy, pandas, Matplotlib, seaborn',
    category: 'ai',
    year: 2026,
    tested: 'The standard Python data stack, worked through rather than read about.',
    why: 'Instrumentation and control is a data discipline; the tooling is the same tooling.',
    result: 'TODO — what you can do now that you could not before.',
    learned: 'TODO.',
    source: 'https://github.com/Mudit13-tech/PYTHON-ML',
  },
  {
    id: 'website-clones',
    name: 'Website clones',
    category: 'interface',
    year: 2026,
    tested: 'Whether a layout you admire can be rebuilt from the outside in, with no source to peek at.',
    why: 'Rebuilding something that already works teaches the layout decisions faster than reading about them.',
    result: 'TODO — 5 MB of HTML and CSS across several clones. Which one was hardest?',
    learned: 'TODO.',
    source: 'https://github.com/Mudit13-tech/HTML-CSS',
  },
  {
    id: 'ipo-screen',
    name: 'IPO screening tool',
    category: 'misc',
    year: 2026,
    tested: 'Whether the public filings around an IPO can be reduced to a decision.',
    why: 'Wanted a question answered for a portfolio, and building the answer is more interesting than reading someone else\'s.',
    result: 'TODO — the repository is 3.9 KB of Python and a backend folder, so say plainly how far it got.',
    learned: 'TODO.',
    source: 'https://github.com/Mudit13-tech/DEBATE-DESK',
  },
]
