require('../styles/error.css');

export default function Error(props) {
    const { state, text } = props;

    return(
        <div className='error_wrapper' style={!state ? { display: 'none' } : {}}>
            {text}
        </div>
    )
}