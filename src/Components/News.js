import React, { useEffect, useState } from 'react'
import NewsItem from './Newsitem';
import Spinner from './spinner';
import PropTypes from 'prop-types'
import InfiniteScroll from 'react-infinite-scroll-component';


const News = (props) => {
    const [articles, setArticles] = useState([]);
    const [loading, setloading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    // document.title = `${capitalizeFirstLetter(props.category)} - NewsHub`;

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const buildTheNewsApiUrl = (pageNumber, includeLocale = true) => {
        const params = new URLSearchParams({
            api_token: props.apiKey,
            categories: props.category,
            limit: props.pageSize,
            page: pageNumber
        });

        if (props.language) {
            params.append('language', props.language);
        }

        if (includeLocale && props.country) {
            params.append('locale', props.country);
        }

        return `https://api.thenewsapi.com/v1/news/top?${params.toString()}`;
    };

    const fetchHeadlines = async (pageNumber, includeLocale = true) => {
        const response = await fetch(buildTheNewsApiUrl(pageNumber, includeLocale));
        const parsedData = await response.json();
        if (!response.ok || parsedData.error) {
            throw new Error(parsedData.error?.message || 'Unable to fetch news headlines');
        }
        return parsedData;
    };

    const resolveHeadlines = async (pageNumber) => {
        const shouldUseLocale = Boolean(props.country);
        try {
            let parsedData = await fetchHeadlines(pageNumber, shouldUseLocale);
            if ((parsedData.data?.length ?? 0) === 0 && shouldUseLocale) {
                parsedData = await fetchHeadlines(pageNumber, false);
                setNotice('Showing global headlines because no articles were found for your selected region.');
            } else {
                setNotice(null);
            }
            return parsedData;
        } catch (error) {
            setNotice(null);
            throw error;
        }
    };

    const transformArticles = (data = []) => (
        data.map(article => ({
            title: article.title,
            description: article.description || article.snippet,
            urlToImage: article.image_url,
            url: article.url,
            author: article.author || article.source,
            publishedAt: article.published_at,
            source: { name: article.source || 'Unknown' }
        }))
    );

    const updateNews = async () => {
        props.setProgress(10);
        setloading(true);
        setError(null);
        try {
            const parsedData = await resolveHeadlines(1);
            props.setProgress(30);
            props.setProgress(70);
            const formattedArticles = transformArticles(parsedData.data);
            setArticles(formattedArticles);
            setTotalResults(parsedData.meta?.found || formattedArticles.length || 0);
            setPage(1);
            setHasMore((parsedData.meta?.found ?? formattedArticles.length) > formattedArticles.length || formattedArticles.length === props.pageSize);
        } catch (error) {
            console.error('Fetch Error:', error);
            setError(error.message);
        } finally {
            setloading(false);
            props.setProgress(100);
        }
    }

    useEffect(() => {
        updateNews();
    // eslint-disable-next-line
    }, [props.category, props.country, props.pageSize]);

    const fetchMoreData = async () => {
        const nextPage = page + 1;
        try {
            const parsedData = await resolveHeadlines(nextPage);
            const formattedArticles = transformArticles(parsedData.data);
            setPage(nextPage);
            setArticles(articles.concat(formattedArticles));
            setTotalResults(parsedData.meta?.found || totalResults + formattedArticles.length);
            if (formattedArticles.length === 0) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Pagination Fetch Error:', error);
            setError(error.message);
            setHasMore(false);
        }
    };

        return (
            <>
                <h1 className="text-center" style={{ margin: '30px 0px', marginTop: '75px' }}>NewsHub - Top {capitalizeFirstLetter(props.category)} headlines</h1>
                {error && <div className="alert alert-danger text-center" role="alert">{error}</div>}
                {loading && <Spinner />}
                {!loading && notice && (
                    <div className="alert alert-info text-center" role="alert">{notice}</div>
                )}
                {!loading && !error && articles.length === 0 && (
                    <p className="text-center text-muted">No articles available for this category yet. Try another filter.</p>
                )}
                <InfiniteScroll
                    dataLength={articles?.length || 0}
                    next={fetchMoreData}
                    hasMore={!error && hasMore}
                    loader={!loading ? <Spinner /> : null}
                >
                    <div className="container">
                        <div className="row">
                            {articles.map((element, index) => {
                                return <div className="col-md-4" key={index}>
                                    <NewsItem title={element.title ? element.title : ""} description={element.description ? element.description : ""} imageUrl={element.urlToImage} newsUrl={element.url} author={element.author} date={element.publishedAt} source={element.source.name} />
                                    </div>
                            })}
                        </div>
                    </div>
                </InfiniteScroll>
            </>

        )
}

News.defaultProps = {
    country: 'in',
    pageSize: 8,
    category: 'general'
}

News.propTypes = {
    country: PropTypes.string,
    pageSize: PropTypes.number,
    category: PropTypes.string
}

export default News
