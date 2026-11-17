import re
from collections import Counter


_SKILLS = (
    "amazon web services", "google cloud platform", "machine learning",
    "data analysis", "data analytics", "project management", "customer service",
    "artificial intelligence", "natural language processing", "user experience",
    "rest api", "ci/cd", "javascript", "typescript", "python", "java", "c++",
    "c#", "golang", "ruby", "php", "sql", "postgresql", "mysql", "mongodb",
    "react", "next.js", "vue", "angular", "node.js", "fastapi", "django",
    "flask", "spring boot", "express.js", "html", "css", "tailwind",
    "docker", "kubernetes", "terraform", "aws", "azure", "gcp", "linux",
    "git", "github", "gitlab", "jenkins", "graphql", "redis", "pandas",
    "numpy", "scikit-learn", "tensorflow", "pytorch", "excel", "tableau",
    "power bi", "communication", "leadership", "agile", "scrum", "figma",
    "testing", "automation", "salesforce", "security",
)
_STOP_WORDS = frozenset(
    "a an and are as at be by for from in into is it of on or that the to with "
    "will within across about all also any both can do each every have including "
    "its must our their this you your we they who which while work working "
    "role candidate team experience years required preferred responsibilities "
    "requirements skills ability strong excellent".split()
)
_WORD_RE = re.compile(r"[a-z0-9+#.]+", re.IGNORECASE)


def _contains_phrase(text: str, phrase: str) -> bool:
    return re.search(r"(?<![a-z0-9])" + re.escape(phrase) + r"(?![a-z0-9])", text) is not None


def _extract_skills(text: str) -> list[str]:
    normalized = text.casefold()
    return sorted(
        (skill for skill in set(_SKILLS) if _contains_phrase(normalized, skill)),
        key=lambda skill: (skill.casefold(), skill),
    )


def _extract_keywords(text: str, excluded: set[str], limit: int = 20) -> list[str]:
    words = [word.casefold().strip(".") for word in _WORD_RE.findall(text)]
    words = [word for word in words if word]
    counts = Counter(
        word for word in words
        if len(word) > 2 and word not in _STOP_WORDS and word not in excluded
    )
    first_position = {}
    for position, word in enumerate(words):
        if word in counts and word not in first_position:
            first_position[word] = position
    ranked = sorted(counts, key=lambda word: (-counts[word], first_position[word], word))
    return ranked[:limit]


def analyze_resume(
    resume_text: str, job_description: str, custom_keywords: list[str] | None = None
) -> dict:
    """Return a reproducible ATS estimate based on job-skill and keyword coverage."""
    resume = resume_text.casefold()
    job_skills = _extract_skills(job_description)
    resume_skills = set(_extract_skills(resume_text))
    matched_skills = [skill for skill in job_skills if skill in resume_skills]
    missing_skills = [skill for skill in job_skills if skill not in resume_skills]

    skill_words = {word for skill in job_skills for word in _WORD_RE.findall(skill)}
    job_keywords = _extract_keywords(job_description, skill_words)
    for keyword in custom_keywords or []:
        normalized_keyword = keyword.strip().casefold()
        if normalized_keyword and normalized_keyword not in job_keywords:
            job_keywords.append(normalized_keyword)
    matched_keywords = [
        keyword for keyword in job_keywords if _contains_phrase(resume, keyword)
    ]
    missing_keywords = [keyword for keyword in job_keywords if keyword not in matched_keywords]

    skill_score = len(matched_skills) / len(job_skills) if job_skills else None
    keyword_score = len(matched_keywords) / len(job_keywords) if job_keywords else None
    if skill_score is not None and keyword_score is not None:
        score = round((skill_score * 0.7 + keyword_score * 0.3) * 100)
    elif skill_score is not None:
        score = round(skill_score * 100)
    elif keyword_score is not None:
        score = round(keyword_score * 100)
    else:
        score = 0

    return {
        "ats_score": score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
    }
