const NEWS_API_KEY = "11616c7dc6ef457182a7d830fc4a3e82"; 

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);     
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);   
  const toIso = (d) => d.toISOString().slice(0, 10);                
  return { from: toIso(start), to: toIso(end) };
}


async function fetchNews({ topicQuery, page = 1 }) {
  const { from, to } = getMonthRange();                             
  const url = new URL("https://newsapi.org/v2/everything");         
  url.searchParams.set("q", topicQuery);                           
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "10");                          
  url.searchParams.set("page", String(page));

  const res = await fetch(url, {
    headers: { "X-Api-Key": NEWS_API_KEY }                          
  });

  if (!res.ok) {
    throw new Error("Failed to fetch news");
  }
  const data = await res.json();
  if (data.status !== "ok") {
    throw new Error(data.message || "News API error");
  }
  return data;                                                      
}


function renderArticles({ container, articles }) {
  if (!container) return;
  container.innerHTML = "";

  if (!articles || articles.length === 0) {
    container.innerHTML = "<p>No articles found for this month.</p>";
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const article of articles) {
    const card = document.createElement("article");
    card.className = "news-card";                                   

    const imageUrl =
      article.urlToImage ||
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80"; // fallback[web:56]

    const published = article.publishedAt
      ? new Date(article.publishedAt).toLocaleDateString()
      : "Unknown date";

    card.innerHTML = `
      <img src="${imageUrl}" alt="Article image">
      <div class="news-card-body">
        <h3 class="news-card-title">${article.title || "Untitled"}</h3>
        <div class="news-card-meta">
          <span>${article.source?.name || "Unknown source"}</span>
          <span>•</span>
          <span>${published}</span>
        </div>
        <p class="news-card-desc">
          ${article.description || "No description available."}
        </p>
        <div class="news-card-footer">
          <a class="news-card-link" href="${article.url}" target="_blank" rel="noopener">
            Read full article
          </a>
        </div>
      </div>
    `;
    fragment.appendChild(card);
  }

  container.appendChild(fragment);
}

function initTopicPage({
  topicName,
  baseQuery,
  sections
}) {
  const cardsContainer = document.querySelector("[data-news-cards]");
  const statusText = document.querySelector("[data-news-status]");
  const loadMoreBtn = document.querySelector("[data-load-more]");

  let currentSection = sections[0];
  let currentPage = 1;
  let accumulatedArticles = [];

  function setStatus(msg) {
    if (statusText) statusText.textContent = msg || "";
  }

  async function loadSection(section, reset = true) {
    if (!cardsContainer) return;
    currentSection = section;
    if (reset) {
      currentPage = 1;
      accumulatedArticles = [];
      setStatus("Loading articles...");
    }

    const query = `${baseQuery} ${section.query}`.trim();

    try {
      if (loadMoreBtn) loadMoreBtn.disabled = true;

      const data = await fetchNews({ topicQuery: query, page: currentPage });
      accumulatedArticles = reset
        ? data.articles
        : accumulatedArticles.concat(data.articles);

      renderArticles({ container: cardsContainer, articles: accumulatedArticles });

      if (loadMoreBtn) {
        const totalPages = Math.ceil((data.totalResults || 0) / 10);
        if (currentPage < totalPages && currentPage < 5) {          
          loadMoreBtn.disabled = false;
          loadMoreBtn.style.display = "inline-flex";
          setStatus(`Showing page ${currentPage} of about ${Math.min(totalPages, 5)}.`);
        } else {
          loadMoreBtn.style.display = "none";
          setStatus(`All available articles loaded for ${topicName}.`);
        }
      }
    } catch (err) {
      console.error("News API error:", err);
      setStatus("Error loading news. Please try again later.");
    }
  }


  const chipButtons = document.querySelectorAll("[data-section-chip]");
  chipButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-section-chip");
      const section = sections.find((s) => s.id === id);
      if (!section) return;

      chipButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadSection(section, true);
    });
  });

  
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      currentPage += 1;
      loadSection(currentSection, false);
    });
  }

  
  loadSection(currentSection, true);
}
