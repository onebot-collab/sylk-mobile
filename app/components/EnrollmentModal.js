import React, { Component } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import PropTypes from 'prop-types';
import superagent from 'superagent';
import autoBind from 'auto-bind';
import { Dialog, Portal, Button, TextInput, Title, Surface, HelperText, Snackbar } from 'react-native-paper';
import KeyboardAwareDialog from './KeyBoardAwareDialog';
import LoadingScreen from './LoadingScreen';

const DialogType = Platform.OS === 'ios' ? KeyboardAwareDialog : Dialog;

import styles from '../assets/styles/blink/_EnrollmentModal.scss';

import config from '../config';

class EnrollmentModal extends Component {
    constructor(props) {
        super(props);
        autoBind(this);

        // save the initial state so we can restore it later
        this.initialState = {
            displayName: '',
            username: '',
            password: '',
            password2: '',
            email: '',
            enrolling: false,
            error: '',
            errorVisible: false
        };
        this.state = Object.assign({}, this.initialState);
    }

    handleFormFieldChange(value, name) {
        this.setState({
            [name]: value
        });
    }

    validInput() {
        let valid_input = !this.state.enrolling &&
                          this.state.displayName !== '' &&
                          this.state.username !== '' &&
                          this.state.username.length > 2 &&
                          this.state.password !== '' &&
                          this.state.password2 !== '' &&
                          this.state.password === this.state.password2 &&
                          this.state.password.length > 4 &&
                          this.state.email !== '';
        return valid_input;
    }

    enroll(event) {
        event.preventDefault();

        this.setState({enrolling: true, error:''});

        superagent.post(config.enrollmentUrl)
                  .send(superagent.serialize['application/x-www-form-urlencoded']({username: this.state.username,
                                                                                   password: this.state.password,
                                                                                   email: this.state.email,
                                                                                   phoneNumber: this.props.phoneNumber,
                                                                                   display_name: this.state.displayName}))   //eslint-disable-line camelcase
                  .end((error, res) => {
                      this.setState({enrolling: false});
                      if (error) {
                          this.setState({error: error.toString(), errorVisible: true});
                          return;
                      }
                      let data;
                      try {
                          data = JSON.parse(res.text);
                      } catch (e) {
                          this.setState({error: 'Could not decode response data', errorVisible: true});
                          return;
                      }
                      if (data.success) {
                          this.props.handleEnrollment({accountId: data.sip_address,
                                                       password: this.state.password});
                          this.setState(this.initialState);
                      } else if (data.error === 'user_exists') {
                          this.setState({error: 'Username already exists. Chose another!', errorVisible: true});
                      } else {
                          this.setState({error: data.error_message, errorVisible: true});
                      }
                  });
    }

    onHide() {
        this.props.handleEnrollment(null);
        this.setState(this.initialState);
    }

    render() {
        let buttonText = 'Sign Up';
        let buttonIcon = null;
        let loadingText = 'Enrolling...';

        if (this.state.enrolling) {
            buttonIcon = "cog";
        }

        return (
            <Portal>
                    <DialogType visible={this.props.show} onDismiss={this.onHide}>
                    <LoadingScreen
                    text={loadingText}
                    show={this.state.enrolling}
                    />
                    <Surface style={styles.container}>
                        <Dialog.Title style={styles.title}>Create account</Dialog.Title>
                        <TextInput style={styles.row}
                            mode="flat"
                            label="Display name"
                            name="displayName"
                            type="text"
                            placeholder="Displayed on remote devices"
                            onChangeText={(text) => {this.handleFormFieldChange(text, 'displayName');}}
                            required
                            value={this.state.displayName}
                            disabled={this.state.enrolling}
                            returnKeyType="next"
                            onSubmitEditing={() => this.emailInput.focus()}
                        />
                        <TextInput style={styles.row}
                            mode="flat"
                            label="E-mail"
                            textContentType="emailAddress"
                            name="email"
                            autoCapitalize="none"
                            placeholder="Used to recover the password"
                            onChangeText={(text) => {this.handleFormFieldChange(text, 'email');}}
                            required value={this.state.email}
                            disabled={this.state.enrolling}
                            returnKeyType="go"
                            ref={ref => {
                                this.emailInput = ref;
                            }}
                            onSubmitEditing={() => this.usernameInput.focus()}
                        />
                        <TextInput style={styles.row}
                            mode="flat"
                            label="Username"
                            name="username"
                            placeholder="Enter at least 4 characters"
                            autoCapitalize="none"
                            onChangeText={(text) => {this.handleFormFieldChange(text, 'username');}}
                            required
                            value={this.state.username}
                            disabled={this.state.enrolling}
                            returnKeyType="next"
                            ref={ref => {
                                this.usernameInput = ref;
                            }}
                            onSubmitEditing={() => this.passwordInput.focus()}
                        />
                        <TextInput style={styles.row}
                            mode="flat"
                            label="Password"
                            name="password"
                            secureTextEntry={true}
                            placeholder="Enter at least 5 characters"
                            textContentType="password"
                            onChangeText={(text) => {this.handleFormFieldChange(text, 'password');}}
                            required value={this.state.password}
                            disabled={this.state.enrolling}
                            returnKeyType="next"
                            ref={ref => {
                                this.passwordInput = ref;
                            }}
                            onSubmitEditing={() => this.password2Input.focus()}
                        />
                        <TextInput style={styles.row}
                            mode="flat"
                            label="Verify password"
                            secureTextEntry={true}
                            textContentType="password"
                            name="password2"
                            onChangeText={(text) => {this.handleFormFieldChange(text, 'password2');}}
                            required value={this.state.password2}
                            disabled={this.state.enrolling}
                            returnKeyType="next"
                            ref={ref => {
                                this.password2Input = ref;
                            }}
                        />
                        <Button
                            mode="contained"
                            style={styles.button}
                            icon={buttonIcon}
                            disabled={!this.validInput()}
                            onPress={this.enroll}
                        >
                            {buttonText}
                        </Button>
                        <Snackbar
                            visible={this.state.errorVisible}
                            duration={2000}
                            onDismiss={() => this.setState({ errorVisible: false })}
                        >
                            {this.state.error}
                        </Snackbar>
                    </Surface>
                </DialogType>
            </Portal>
        );
    }
}

EnrollmentModal.propTypes = {
    handleEnrollment: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired,
    phoneNumber : PropTypes.string
};

export default EnrollmentModal;
