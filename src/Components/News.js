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
    const [error, setError] = useState(null);
    // document.title = `${capitalizeFirstLetter(props.category)} - NewsHub`;

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const buildNewsApiUrl = (pageNumber) => (
        `https://newsapi.org/v2/top-headlines?country=${props.country}&category=${props.category}&apiKey=${props.apiKey}&page=${pageNumber}&pageSize=${props.pageSize}`
    );

    const updateNews = async () => {
        props.setProgress(10);
        setloading(true);
        setError(null);
        try {
            const response = await fetch(buildNewsApiUrl(1));
            props.setProgress(30);
            const parsedData = await response.json();
            props.setProgress(70);
            if (parsedData.status !== 'ok') {
                throw new Error(parsedData.message || 'Unable to fetch news headlines');
            }
            setArticles(parsedData.articles || []);
            setTotalResults(parsedData.totalResults || 0);
            setPage(1);
        } catch (error) {
            console.error('Fetch Error:', error);
            setError(error.message);
        }
        setloading(false);
        props.setProgress(100);
    }

    useEffect(() => {
        updateNews();
    // eslint-disable-next-line
    }, [props.category, props.country, props.pageSize]);

    const fetchMoreData = async () => {
        const nextPage = page + 1;
        try {
            const response = await fetch(buildNewsApiUrl(nextPage));
            const parsedData = await response.json();
            if (parsedData.status !== 'ok') {
                throw new Error(parsedData.message || 'Unable to load more headlines');
            }
            setPage(nextPage);
            setArticles(articles.concat(parsedData.articles || []));
            setTotalResults(parsedData.totalResults || totalResults);
        } catch (error) {
            console.error('Pagination Fetch Error:', error);
            setError(error.message);
        }
    };

        return (
            <>
                <h1 className="text-center" style={{ margin: '30px 0px', marginTop: '75px' }}>NewsHub - Top {capitalizeFirstLetter(props.category)} headlines</h1>
                {error && <div className="alert alert-danger text-center" role="alert">{error}</div>}
                {loading && <Spinner />}
                <InfiniteScroll
                    dataLength={articles?.length || 0}
                    next={fetchMoreData}
                    hasMore={articles.length < totalResults}
                    loader={<Spinner />}
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
