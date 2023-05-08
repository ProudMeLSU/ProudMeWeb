import React, {useState, useEffect} from 'react';
import '../css/home.css';
import Button from '@material-ui/core/Button';
import { useNavigate } from 'react-router-dom';
import withAuth from '../components/auth/withAuth';
import axios from 'axios';

const HomeScreen = (props) => {

    let navigate = useNavigate();

    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetch('http://localhost:3001/users')
          .then(response => response.json())
          .then(data => setUsers(data))
          .catch(error => console.error(error));
    }, []);

    var dateToday = new Date(),
    date = "Today's date is " + (dateToday.getMonth() + 1)+ '/' + dateToday.getDate()  + '/' +  dateToday.getFullYear() + ".";

    var currentTime = dateToday.toLocaleTimeString();

    return (
        <div className="home">
            <h1 className="title">Hello {users.map(user => (<div key={user._id}>{user.email}</div>))}!</h1>
            <h4>{date}</h4>
            <h4>{currentTime}</h4>
            <div className="imageWrapper">
            <div className="left-icons">
                <a className="click-icons" onClick={() => navigate('/pet')}>
                    <img className="miniGamesIcon" src={require('../components/images/home/mini_games_icon.png')} />
                </a>
                <a className="click-icons" onClick={() => navigate('/pe')}>
                    <img className="peIcon" src={require('../components/images/home/proudme_pe_icon.png')} />
                </a>
                <a className="click-icons" onClick={() => navigate('/pet')}>
                    <img className="petStoreIcon" src={require('../components/images/home/pet_store_icon.png')} />
                </a>
            </div>
                <img className="petRoom" src={require('../components/images/home/pet_room_icon.png')} />
                <Button style={{fontSize: '25px', position: 'absolute', 
                zIndex: '1', margin: 'auto', textTransform: 'none',
                backgroundColor: '#EED5AB', borderRadius: '50px', color: '#A87B06',
                fontWeight: 'bold',padding: '10px 30px 10px 30px', marginTop: '29%'}}>Visit PetName!</Button>
            <div className="right-icons">
                <a className="click-icons" onClick={() => navigate('/journal')}>
                    <img className="checkinIcon" src={require('../components/images/home/checkin_icon.png')} />
                </a>
                <a className="click-icons" onClick={() => navigate('/journal')}>
                    <img className="journalIcon" src={require('../components/images/home/journal_icon.png')} />
                </a>
            </div>
            </div>

            
        </div>
    );
};

export default withAuth(HomeScreen);