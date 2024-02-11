import User from "./User";
import { Component } from 'react';

class About extends Component{
  constructor(props){
    super(props);
    // console.log("p constructor");
  }

  render(){
    // console.log("p render");
    return (
      <div>
          <h2>About Swadify</h2>
          <User />
      </div>
    )
  }
}

export default About;